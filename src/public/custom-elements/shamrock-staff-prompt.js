/**
 * <shamrock-staff-prompt>
 * Drop on /portal-staff as a Custom Element (ID #staffPromptElement).
 * Page code: element.setAttribute('prompt', JSON.stringify(spec))
 * Listens for 'staff-prompt-result' CustomEvent { value, cancelled, requestId }.
 */
class ShamrockStaffPrompt extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._requestId = '';
        this._mode = 'input';
        this._selected = '';
    }

    static get observedAttributes() {
        return ['prompt'];
    }

    connectedCallback() {
        this.render();
        this.bind();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== 'prompt' || !newValue || newValue === oldValue) return;
        try {
            this.open(JSON.parse(newValue));
        } catch (e) {
            this.open({ title: 'Staff prompt' });
        }
    }

    open(spec) {
        spec = spec || {};
        this._requestId = spec.requestId || '';
        this._mode = spec.mode === 'select' ? 'select' : 'input';
        this._selected = (spec.options && spec.options[0]) || '';
        const title = this.shadowRoot.getElementById('title');
        const hint = this.shadowRoot.getElementById('hint');
        const input = this.shadowRoot.getElementById('input');
        const options = this.shadowRoot.getElementById('options');
        title.textContent = spec.title || 'Staff prompt';
        hint.textContent = spec.hint || spec.placeholder || '';
        if (this._mode === 'select') {
            input.hidden = true;
            options.hidden = false;
            options.innerHTML = '';
            (spec.options || []).forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'opt' + (idx === 0 ? ' selected' : '');
                btn.textContent = String(opt).replace(/_/g, ' ');
                btn.addEventListener('click', () => {
                    options.querySelectorAll('.opt').forEach((el) => el.classList.remove('selected'));
                    btn.classList.add('selected');
                    this._selected = opt;
                });
                options.appendChild(btn);
            });
        } else {
            input.hidden = false;
            options.hidden = true;
            input.value = '';
            input.placeholder = spec.placeholder || '';
        }
        this.shadowRoot.getElementById('overlay').classList.add('open');
        if (this._mode === 'input') setTimeout(() => input.focus(), 40);
    }

    close(cancelled) {
        this.shadowRoot.getElementById('overlay').classList.remove('open');
        const input = this.shadowRoot.getElementById('input');
        const value = cancelled
            ? null
            : (this._mode === 'select' ? (this._selected || null) : (input.value || '').trim() || null);
        const detail = { value, cancelled: !!cancelled, requestId: this._requestId };
        this.dispatchEvent(new CustomEvent('staff-prompt-result', { detail, bubbles: true, composed: true }));
    }

    bind() {
        this.shadowRoot.getElementById('cancel').addEventListener('click', () => this.close(true));
        this.shadowRoot.getElementById('confirm').addEventListener('click', () => this.close(false));
        this.shadowRoot.getElementById('input').addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') this.close(false);
            if (ev.key === 'Escape') this.close(true);
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { font-family: Inter, -apple-system, sans-serif; }
                .overlay { display:none; position:fixed; inset:0; background:rgba(5,8,16,.72); z-index:10000; align-items:center; justify-content:center; padding:24px; }
                .overlay.open { display:flex; }
                .modal { width:100%; max-width:440px; background:#111827; border:1px solid #1e293b; border-radius:16px; padding:24px; color:#e2e8f0; }
                h2 { margin:0 0 8px; font-size:18px; }
                p { margin:0 0 16px; font-size:13px; color:#94a3b8; }
                input { width:100%; box-sizing:border-box; min-height:44px; font-size:16px; padding:12px 14px; border-radius:10px; border:1px solid #1e293b; background:#0a0e1a; color:#e2e8f0; }
                .opts { display:flex; flex-direction:column; gap:8px; }
                .opt { min-height:44px; text-align:left; padding:12px 16px; border-radius:10px; border:1px solid #1e293b; background:#0a0e1a; color:#e2e8f0; font-weight:600; cursor:pointer; }
                .opt.selected { border-color:#10b981; color:#10b981; background:rgba(16,185,129,.15); }
                .actions { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; }
                button.btn { min-height:44px; padding:10px 20px; border-radius:8px; font-weight:600; cursor:pointer; }
                #cancel { background:#0a0e1a; color:#e2e8f0; border:1px solid #1e293b; }
                #confirm { background:#10b981; color:#fff; border:none; }
            </style>
            <div class="overlay" id="overlay" role="dialog" aria-modal="true">
                <div class="modal">
                    <h2 id="title">Staff prompt</h2>
                    <p id="hint"></p>
                    <input id="input" type="text" autocomplete="off">
                    <div class="opts" id="options" hidden></div>
                    <div class="actions">
                        <button type="button" class="btn" id="cancel">Cancel</button>
                        <button type="button" class="btn" id="confirm">Continue</button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('shamrock-staff-prompt', ShamrockStaffPrompt);
