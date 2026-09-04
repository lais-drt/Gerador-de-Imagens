const StorageManager = {
    // genericCategories array removed. Using dynamic list in categoriesDB.
    defaultKeywords: {
        burger: 'hamburguer, burger, x-, sanduiche, lanche',
        pizza: 'pizza, calzone',
        acai: 'açai, açaí, acai',
        marmitex: 'marmitex, quentinha, almoço, prato',
        japonesa: 'sushi, sashimi, temaki, combo, japa',
        salgados: 'coxinha, salgado, pastel, empada',
        sorvete: 'sorvete, picole, picolé, milk shake',
        hotdog: 'hot dog, cachorro quente, prensado'
    },

    async init() {
        this.templatesDB = localforage.createInstance({ name: "bigou", storeName: "templates" });
        this.fontsDB = localforage.createInstance({ name: "bigou", storeName: "fonts" });
        this.genericsDB = localforage.createInstance({ name: "bigou", storeName: "generics" });
        this.keywordsDB = localforage.createInstance({ name: "bigou", storeName: "keywords" });
        this.categoriesDB = localforage.createInstance({ name: "bigou", storeName: "categories" });
        this.campaignsDB = localforage.createInstance({ name: "bigou", storeName: "campaigns" });
        
        await this.loadFontsFromStorage();
    },

    // --- CATEGORIES ---
    async getCategories() {
        const savedCategories = await this.categoriesDB.getItem('list');
        if (!savedCategories) {
            const defaultCats = [
                { id: 'burger', name: 'Hambúrguer' },
                { id: 'pizza', name: 'Pizza' },
                { id: 'acai', name: 'Açaí' },
                { id: 'marmitex', name: 'Marmitex' },
                { id: 'japonesa', name: 'Comida Japonesa' },
                { id: 'salgados', name: 'Salgados' },
                { id: 'sorvete', name: 'Sorvete' },
                { id: 'hotdog', name: 'Cachorro Quente' }
            ];
            await this.categoriesDB.setItem('list', defaultCats);
            return defaultCats;
        }
        return savedCategories;
    },

    async addCategory(name) {
        const id = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cats = await this.getCategories();
        if (!cats.some(c => c.id === id)) {
            cats.push({ id, name });
            await this.categoriesDB.setItem('list', cats);
        }
        return id;
    },

    // --- TEMPLATES ---
    async getTemplates() {
        const keys = await this.templatesDB.keys();
        const templates = [];
        for (let k of keys) {
            templates.push(await this.templatesDB.getItem(k));
        }
        return templates;
    },

    async saveTemplate(templateObj) {
        if (!templateObj.id) templateObj.id = 'tpl_' + Date.now();
        await this.templatesDB.setItem(templateObj.id, templateObj);
        return templateObj;
    },

    async deleteTemplate(id) {
        await this.templatesDB.removeItem(id);
    },

    // --- FONTS ---
    async getFonts() {
        const keys = await this.fontsDB.keys();
        const fonts = [];
        for (let k of keys) {
            fonts.push(await this.fontsDB.getItem(k));
        }
        return fonts;
    },

    async saveFont(name, base64Data) {
        const fontId = 'font_' + Date.now() + Math.floor(Math.random()*1000);
        const fontObj = { id: fontId, name, data: base64Data };
        await this.fontsDB.setItem(fontId, fontObj);
        await this.injectFont(name, base64Data);
        return fontObj;
    },

    async deleteFont(id) {
        await this.fontsDB.removeItem(id);
    },

    async loadFontsFromStorage() {
        const fonts = await this.getFonts();
        let cssString = '';
        const fontLoadPromises = [];
        fonts.forEach(f => {
            cssString += `
            @font-face {
                font-family: '${f.name}';
                src: url('${f.data}');
            }\n`;
        });
        document.getElementById('custom-fonts-style').innerHTML = cssString;
        
        // Força o navegador a pré-carregar as fontes na memória
        fonts.forEach(f => {
            try { fontLoadPromises.push(document.fonts.load(`16px "${f.name}"`)); } catch(e){}
        });
        await Promise.all(fontLoadPromises);
    },

    async injectFont(name, data) {
        const cssString = `
        @font-face {
            font-family: '${name}';
            src: url('${data}');
        }\n`;
        document.getElementById('custom-fonts-style').innerHTML += cssString;
        try { await document.fonts.load(`16px "${name}"`); } catch(e){}
    },

    // --- GENERICS & KEYWORDS ---
    async getGenerics() {
        const data = {};
        const cats = await this.getCategories();
        for (let cat of cats) {
            data[cat.id] = await this.genericsDB.getItem('gen_' + cat.id) || '';
        }
        return data;
    },

    async saveGeneric(type, base64Data) {
        await this.genericsDB.setItem('gen_' + type, base64Data);
    },

    async getKeywords() {
        const keys = {};
        const cats = await this.getCategories();
        for (let cat of cats) {
            let saved = await this.keywordsDB.getItem('kw_' + cat.id);
            keys[cat.id] = saved !== null ? saved : (this.defaultKeywords[cat.id] || '');
        }
        return keys;
    },

    async saveKeyword(type, keywordsString) {
        await this.keywordsDB.setItem('kw_' + type, keywordsString);
    },

    // --- CAMPAIGNS ---
    // Results are stored one-per-key (campaignId::r::index) instead of embedded in the
    // campaign document. A campaign with thousands of full-resolution renders can reach
    // multiple GB; cloning that as a single IndexedDB value freezes the tab for minutes
    // (or forever) during structured-clone serialization. Small independent writes avoid
    // that single giant blocking clone. getCampaign/saveCampaign still accept/return a
    // plain {..., results: [...]} object so the rest of the app doesn't need to change.
    resultKey(campaignId, index) {
        return `${campaignId}::r::${index}`;
    },

    // Runs an async fn over indices [0, count) BATCH_SIZE-at-a-time, instead of either
    // one-by-one (slow for thousands of small IndexedDB ops) or all-at-once (spikes memory
    // and pending-transaction count for very large campaigns). The setTimeout(0) between
    // batches forces a real macrotask boundary so thousands of chained IndexedDB promise
    // resolutions can't monopolize the event loop and freeze the tab (input, rendering,
    // devtools) for the whole duration on very large campaigns.
    async runBatched(count, batchSize, fn) {
        const out = new Array(count);
        for (let i = 0; i < count; i += batchSize) {
            const end = Math.min(i + batchSize, count);
            const batch = await Promise.all(Array.from({ length: end - i }, (_, j) => fn(i + j)));
            for (let j = 0; j < batch.length; j++) out[i + j] = batch[j];
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        return out;
    },

    async getCampaigns() {
        const keys = await this.campaignsDB.keys();
        const campaigns = [];
        for (let k of keys) {
            if (k.includes('::')) continue; // skip per-result / parsedData records
            const camp = await this.campaignsDB.getItem(k);
            if (camp) {
                campaigns.push({
                    id: camp.id,
                    name: camp.name,
                    createdAt: camp.createdAt,
                    templateId: camp.templateId,
                    totalItems: camp.resultsCount != null ? camp.resultsCount : (camp.results ? camp.results.length : 0)
                });
            }
        }
        return campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async getCampaign(id) {
        const meta = await this.campaignsDB.getItem(id);
        if (!meta) return null;

        // Legacy campaigns (saved before chunked storage) already embed everything.
        if (Array.isArray(meta.results)) return meta;

        const count = meta.resultsCount || 0;
        const results = await this.runBatched(count, 25, i => this.campaignsDB.getItem(this.resultKey(id, i)));
        const parsedData = await this.campaignsDB.getItem(`${id}::parsedData`) || [];
        return { ...meta, results, parsedData };
    },

    async saveCampaign(campaignObj) {
        if (!campaignObj.id) {
            campaignObj.id = 'camp_' + Date.now();
            campaignObj.createdAt = new Date().toISOString();
        }
        const results = campaignObj.results || [];

        // Write each render as its own small record instead of one giant object, in
        // batches so we don't fire thousands of concurrent IndexedDB transactions at once.
        await this.runBatched(results.length, 25, i => this.campaignsDB.setItem(this.resultKey(campaignObj.id, i), results[i]));

        await this.campaignsDB.setItem(`${campaignObj.id}::parsedData`, campaignObj.parsedData || []);

        const meta = {
            id: campaignObj.id,
            name: campaignObj.name,
            createdAt: campaignObj.createdAt,
            templateId: campaignObj.templateId,
            noPhotoTreatment: campaignObj.noPhotoTreatment,
            resultsCount: results.length
        };
        await this.campaignsDB.setItem(campaignObj.id, meta);

        return { ...meta, results, parsedData: campaignObj.parsedData || [] };
    },

    async deleteCampaign(id) {
        const meta = await this.campaignsDB.getItem(id);
        if (meta && !Array.isArray(meta.results)) {
            const count = meta.resultsCount || 0;
            await this.runBatched(count, 25, i => this.campaignsDB.removeItem(this.resultKey(id, i)));
            await this.campaignsDB.removeItem(`${id}::parsedData`);
        }
        await this.campaignsDB.removeItem(id);
    }
};

window.StorageManager = StorageManager;
