const TemplateManager = {
    templates: {
        feed: {
            bgDataUrl: null,
            prodImg: { x: 540, y: 675, w: 500, h: 500 },
            prodName: { x: 540, y: 1000, size: 60, color: '#ffffff' },
            pricePromo: { x: 540, y: 1100, size: 90, color: '#26b573' },
            priceOrig: { x: 540, y: 1180, size: 40, color: '#94a3b8' },
            logo: { x: 150, y: 150, size: 120, round: true },
            days: { x: 540, y: 1250, size: 30, color: '#ffffff' }
        },
        story: {
            bgDataUrl: null,
            prodImg: { x: 540, y: 960, w: 600, h: 600 },
            prodName: { x: 540, y: 1300, size: 70, color: '#ffffff' },
            pricePromo: { x: 540, y: 1450, size: 110, color: '#26b573' },
            priceOrig: { x: 540, y: 1550, size: 50, color: '#94a3b8' },
            logo: { x: 540, y: 250, size: 150, round: true },
            days: { x: 540, y: 1650, size: 40, color: '#ffffff' }
        }
    },
    
    currentType: 'feed',

    init() {
        this.loadFromStorage();
        this.setupListeners();
        this.updateFormFields();
        this.drawPreview();
    },

    loadFromStorage() {
        const saved = localStorage.getItem('bigou_templates');
        if (saved) {
            try {
                this.templates = JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing templates", e);
            }
        }
    },

    saveToStorage() {
        this.readFormFields();
        localStorage.setItem('bigou_templates', JSON.stringify(this.templates));
        alert('Template salvo com sucesso!');
    },

    setupListeners() {
        document.getElementById('tpl-type').addEventListener('change', (e) => {
            this.readFormFields(); // Save current before switching
            this.currentType = e.target.value;
            this.updateFormFields();
            this.drawPreview();
        });

        // Background Upload
        document.getElementById('tpl-bg-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                this.templates[this.currentType].bgDataUrl = event.target.result;
                this.drawPreview();
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('btn-save-template').addEventListener('click', () => {
            this.saveToStorage();
        });

        // Listen to all inputs to update preview real-time
        const inputs = document.querySelectorAll('.config-panel input');
        inputs.forEach(input => {
            if (input.id !== 'tpl-bg-upload') {
                input.addEventListener('input', () => {
                    this.readFormFields();
                    this.drawPreview();
                });
            }
        });
    },

    readFormFields() {
        const t = this.templates[this.currentType];
        
        t.prodImg.x = Number(document.getElementById('el-prod-img-x').value);
        t.prodImg.y = Number(document.getElementById('el-prod-img-y').value);
        t.prodImg.w = Number(document.getElementById('el-prod-img-w').value);
        t.prodImg.h = Number(document.getElementById('el-prod-img-h').value);

        t.prodName.x = Number(document.getElementById('el-prod-name-x').value);
        t.prodName.y = Number(document.getElementById('el-prod-name-y').value);
        t.prodName.size = Number(document.getElementById('el-prod-name-size').value);
        t.prodName.color = document.getElementById('el-prod-name-color').value;

        t.pricePromo.x = Number(document.getElementById('el-price-promo-x').value);
        t.pricePromo.y = Number(document.getElementById('el-price-promo-y').value);
        t.pricePromo.size = Number(document.getElementById('el-price-promo-size').value);
        t.pricePromo.color = document.getElementById('el-price-promo-color').value;

        t.priceOrig.x = Number(document.getElementById('el-price-orig-x').value);
        t.priceOrig.y = Number(document.getElementById('el-price-orig-y').value);
        t.priceOrig.size = Number(document.getElementById('el-price-orig-size').value);
        t.priceOrig.color = document.getElementById('el-price-orig-color').value;

        t.logo.x = Number(document.getElementById('el-logo-x').value);
        t.logo.y = Number(document.getElementById('el-logo-y').value);
        t.logo.size = Number(document.getElementById('el-logo-size').value);
        t.logo.round = document.getElementById('el-logo-round').checked;

        t.days.x = Number(document.getElementById('el-days-x').value);
        t.days.y = Number(document.getElementById('el-days-y').value);
        t.days.size = Number(document.getElementById('el-days-size').value);
        t.days.color = document.getElementById('el-days-color').value;
    },

    updateFormFields() {
        const t = this.templates[this.currentType];
        
        document.getElementById('el-prod-img-x').value = t.prodImg.x;
        document.getElementById('el-prod-img-y').value = t.prodImg.y;
        document.getElementById('el-prod-img-w').value = t.prodImg.w;
        document.getElementById('el-prod-img-h').value = t.prodImg.h;

        document.getElementById('el-prod-name-x').value = t.prodName.x;
        document.getElementById('el-prod-name-y').value = t.prodName.y;
        document.getElementById('el-prod-name-size').value = t.prodName.size;
        document.getElementById('el-prod-name-color').value = t.prodName.color;

        document.getElementById('el-price-promo-x').value = t.pricePromo.x;
        document.getElementById('el-price-promo-y').value = t.pricePromo.y;
        document.getElementById('el-price-promo-size').value = t.pricePromo.size;
        document.getElementById('el-price-promo-color').value = t.pricePromo.color;

        document.getElementById('el-price-orig-x').value = t.priceOrig.x;
        document.getElementById('el-price-orig-y').value = t.priceOrig.y;
        document.getElementById('el-price-orig-size').value = t.priceOrig.size;
        document.getElementById('el-price-orig-color').value = t.priceOrig.color;

        document.getElementById('el-logo-x').value = t.logo.x;
        document.getElementById('el-logo-y').value = t.logo.y;
        document.getElementById('el-logo-size').value = t.logo.size;
        document.getElementById('el-logo-round').checked = t.logo.round;

        document.getElementById('el-days-x').value = t.days.x;
        document.getElementById('el-days-y').value = t.days.y;
        document.getElementById('el-days-size').value = t.days.size;
        document.getElementById('el-days-color').value = t.days.color;
    },

    async drawPreview() {
        const canvas = document.getElementById('template-canvas');
        if (!canvas) return;
        
        const isFeed = this.currentType === 'feed';
        canvas.width = 1080;
        canvas.height = isFeed ? 1350 : 1920;
        
        const ctx = canvas.getContext('2d');
        const t = this.templates[this.currentType];

        // 1. Draw Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (t.bgDataUrl) {
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve();
                };
                img.src = t.bgDataUrl;
            });
        }

        // 2. Draw Mock Product Image
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(t.prodImg.x, t.prodImg.y, t.prodImg.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Foto do Produto', t.prodImg.x, t.prodImg.y);

        // 3. Draw Texts
        ctx.textAlign = 'center';
        
        // Name
        ctx.font = `800 ${t.prodName.size}px Inter`;
        ctx.fillStyle = t.prodName.color;
        ctx.fillText('X-Tudo Especial', t.prodName.x, t.prodName.y);

        // Promo Price
        ctx.font = `800 ${t.pricePromo.size}px Inter`;
        ctx.fillStyle = t.pricePromo.color;
        ctx.fillText('R$ 29,90', t.pricePromo.x, t.pricePromo.y);

        // Orig Price
        ctx.font = `500 ${t.priceOrig.size}px Inter`;
        ctx.fillStyle = t.priceOrig.color;
        const origText = 'R$ 39,90';
        ctx.fillText(origText, t.priceOrig.x, t.priceOrig.y);
        // Strikethrough
        const txtWidth = ctx.measureText(origText).width;
        ctx.beginPath();
        ctx.moveTo(t.priceOrig.x - txtWidth/2 - 5, t.priceOrig.y);
        ctx.lineTo(t.priceOrig.x + txtWidth/2 + 5, t.priceOrig.y);
        ctx.strokeStyle = t.priceOrig.color;
        ctx.lineWidth = t.priceOrig.size * 0.1;
        ctx.stroke();

        // Days
        ctx.font = `600 ${t.days.size}px Inter`;
        ctx.fillStyle = t.days.color;
        ctx.fillText('Apenas de Segunda a Sexta', t.days.x, t.days.y);

        // 4. Logo Mock
        ctx.fillStyle = '#ffffff';
        if (t.logo.round) {
            ctx.beginPath();
            ctx.arc(t.logo.x, t.logo.y, t.logo.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(t.logo.x - t.logo.size/2, t.logo.y - t.logo.size/2, t.logo.size, t.logo.size);
        }
        ctx.fillStyle = '#1e293b';
        ctx.font = `700 ${t.logo.size * 0.2}px Inter`;
        ctx.fillText('LOGO', t.logo.x, t.logo.y);
    }
};

// Export to window
window.TemplateManager = TemplateManager;
