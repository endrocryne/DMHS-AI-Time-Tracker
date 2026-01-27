/**
 * UI Customization Module
 * Provides drag-and-drop, resize, and layout customization capabilities
 */

class UICustomizer {
    constructor(framework) {
        this.framework = framework;
        this.customizationMode = false;
        this.draggedElement = null;
        this.resizeElement = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.layoutConfig = this.loadLayout();
        
        this.setupCustomizationControls();
    }

    /**
     * Setup customization controls in settings
     */
    setupCustomizationControls() {
        // Add customization toggle to settings modal if it exists
        const settingsModal = document.getElementById('settingsModal');
        if (!settingsModal) return;

        const modalContent = settingsModal.querySelector('.modal-content');
        if (!modalContent) return;

        // Check if already added
        if (document.getElementById('customizeLayoutToggle')) return;

        // Add customization section before the save button
        const saveButton = document.getElementById('saveSettings');
        if (!saveButton) return;

        const customizationSection = document.createElement('div');
        customizationSection.innerHTML = `
            <div class="form-group toggle-group">
                <label for="customizeLayoutToggle">Customize Layout:</label>
                <label class="switch">
                    <input type="checkbox" id="customizeLayoutToggle">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="form-group">
                <button type="button" id="resetLayoutBtn" style="width: 100%; margin-bottom: 0.5rem;">
                    Reset Layout to Default
                </button>
            </div>
        `;

        saveButton.parentNode.insertBefore(customizationSection, saveButton);

        // Attach event listeners
        const toggle = document.getElementById('customizeLayoutToggle');
        const resetBtn = document.getElementById('resetLayoutBtn');

        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.toggleCustomizationMode(e.target.checked);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetLayout();
            });
        }
    }

    /**
     * Toggle customization mode
     */
    toggleCustomizationMode(enabled) {
        this.customizationMode = enabled;

        if (enabled) {
            this.enableCustomization();
            this.showCustomizationHints();
        } else {
            this.disableCustomization();
            this.hideCustomizationHints();
        }
    }

    /**
     * Enable customization mode
     */
    enableCustomization() {
        // Add customizable class to eligible elements
        const customizableElements = this.getCustomizableElements();
        
        customizableElements.forEach(element => {
            element.classList.add('ui-customizable');
            element.setAttribute('draggable', 'true');
            
            // Add resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'ui-resize-handle';
            resizeHandle.innerHTML = '⋰';
            element.appendChild(resizeHandle);
            
            // Add drag handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'ui-drag-handle';
            dragHandle.innerHTML = '⋮⋮';
            element.appendChild(dragHandle);

            // Attach event listeners
            this.attachDragListeners(element);
            this.attachResizeListeners(element, resizeHandle);
        });

        // Add customization stylesheet if not exists
        if (!document.getElementById('customization-styles')) {
            this.addCustomizationStyles();
        }
    }

    /**
     * Disable customization mode
     */
    disableCustomization() {
        const customizableElements = document.querySelectorAll('.ui-customizable');
        
        customizableElements.forEach(element => {
            element.classList.remove('ui-customizable');
            element.removeAttribute('draggable');
            
            // Remove handles
            const resizeHandle = element.querySelector('.ui-resize-handle');
            const dragHandle = element.querySelector('.ui-drag-handle');
            if (resizeHandle) resizeHandle.remove();
            if (dragHandle) dragHandle.remove();
        });

        // Save current layout
        this.saveLayout();
    }

    /**
     * Get elements that can be customized
     */
    getCustomizableElements() {
        const selectors = [
            '.tab-content > *:not(h1):not(h2):not(h3)',
            '.card',
            '.form-group',
            '.chart-placeholder',
            '.data-table',
            '.notification-list',
            '.dashboard-grid > *',
            '.timer-display',
            '.stopwatch-display'
        ];

        const elements = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Skip if already in list or is a child of customizable element
                if (!elements.includes(el) && !this.hasCustomizableParent(el, elements)) {
                    elements.push(el);
                }
            });
        });

        return elements;
    }

    /**
     * Check if element has a customizable parent
     */
    hasCustomizableParent(element, customizableElements) {
        let parent = element.parentElement;
        while (parent) {
            if (customizableElements.includes(parent)) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }

    /**
     * Attach drag event listeners
     */
    attachDragListeners(element) {
        element.addEventListener('dragstart', (e) => this.handleDragStart(e, element));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e, element));
        element.addEventListener('dragover', (e) => this.handleDragOver(e));
        element.addEventListener('drop', (e) => this.handleDrop(e, element));
    }

    /**
     * Attach resize event listeners
     */
    attachResizeListeners(element, handle) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startResize(e, element);
        });
    }

    /**
     * Handle drag start
     */
    handleDragStart(e, element) {
        this.draggedElement = element;
        element.classList.add('ui-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.innerHTML);
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e, element) {
        element.classList.remove('ui-dragging');
        
        // Remove all drop indicators
        document.querySelectorAll('.ui-drop-target').forEach(el => {
            el.classList.remove('ui-drop-target');
        });
        
        this.draggedElement = null;
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        e.dataTransfer.dropEffect = 'move';
        
        // Add drop indicator
        const target = e.target.closest('.ui-customizable');
        if (target && target !== this.draggedElement) {
            target.classList.add('ui-drop-target');
        }
        
        return false;
    }

    /**
     * Handle drop
     */
    handleDrop(e, element) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (this.draggedElement && element !== this.draggedElement) {
            // Swap positions
            const parent1 = this.draggedElement.parentNode;
            const parent2 = element.parentNode;
            const next1 = this.draggedElement.nextSibling;
            const next2 = element.nextSibling;

            if (parent1 === parent2) {
                // Same parent - swap positions
                parent1.insertBefore(this.draggedElement, element);
                parent2.insertBefore(element, next1);
            } else {
                // Different parents - swap
                parent1.insertBefore(element, next1);
                parent2.insertBefore(this.draggedElement, next2);
            }
        }

        element.classList.remove('ui-drop-target');
        return false;
    }

    /**
     * Start resizing
     */
    startResize(e, element) {
        this.resizeElement = element;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = parseInt(window.getComputedStyle(element).width, 10);
        this.startHeight = parseInt(window.getComputedStyle(element).height, 10);

        document.addEventListener('mousemove', this.doResize.bind(this));
        document.addEventListener('mouseup', this.stopResize.bind(this));
    }

    /**
     * Perform resize
     */
    doResize(e) {
        if (!this.resizeElement) return;

        const width = this.startWidth + (e.clientX - this.startX);
        const height = this.startHeight + (e.clientY - this.startY);

        this.resizeElement.style.width = Math.max(100, width) + 'px';
        this.resizeElement.style.height = Math.max(50, height) + 'px';
    }

    /**
     * Stop resizing
     */
    stopResize() {
        this.resizeElement = null;
        document.removeEventListener('mousemove', this.doResize);
        document.removeEventListener('mouseup', this.stopResize);
    }

    /**
     * Show customization hints
     */
    showCustomizationHints() {
        // Create hint overlay
        const hint = document.createElement('div');
        hint.id = 'customization-hint';
        hint.innerHTML = `
            <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                        background: var(--primary); color: var(--on-primary); 
                        padding: 1rem 2rem; border-radius: var(--border-radius); 
                        box-shadow: 0 4px 8px var(--shadow); z-index: 3000; text-align: center;">
                <strong>Customization Mode Active</strong><br>
                <small>Drag elements to rearrange • Use resize handles to adjust size</small>
            </div>
        `;
        document.body.appendChild(hint);
    }

    /**
     * Hide customization hints
     */
    hideCustomizationHints() {
        const hint = document.getElementById('customization-hint');
        if (hint) hint.remove();
    }

    /**
     * Add customization styles
     */
    addCustomizationStyles() {
        const style = document.createElement('style');
        style.id = 'customization-styles';
        style.textContent = `
            .ui-customizable {
                position: relative;
                cursor: move;
                border: 2px dashed transparent;
                transition: border-color 0.2s;
            }

            .ui-customizable:hover {
                border-color: var(--primary);
            }

            .ui-dragging {
                opacity: 0.5;
            }

            .ui-drop-target {
                border-color: var(--secondary) !important;
                background: rgba(var(--primary-rgb), 0.1);
            }

            .ui-resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 20px;
                height: 20px;
                background: var(--primary);
                color: var(--on-primary);
                cursor: nwse-resize;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                border-radius: var(--border-radius) 0 0 0;
                z-index: 10;
            }

            .ui-drag-handle {
                position: absolute;
                top: 5px;
                right: 5px;
                background: var(--primary);
                color: var(--on-primary);
                padding: 4px 8px;
                border-radius: var(--border-radius);
                cursor: move;
                font-size: 10px;
                opacity: 0.7;
                z-index: 10;
            }

            .ui-drag-handle:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Save layout configuration
     */
    saveLayout() {
        const layout = {};
        
        document.querySelectorAll('.ui-customizable').forEach((element, index) => {
            const id = element.id || `element-${index}`;
            layout[id] = {
                width: element.style.width,
                height: element.style.height,
                order: index
            };
        });

        localStorage.setItem('uiLayout', JSON.stringify(layout));
    }

    /**
     * Load layout configuration
     */
    loadLayout() {
        const saved = localStorage.getItem('uiLayout');
        return saved ? JSON.parse(saved) : {};
    }

    /**
     * Apply saved layout
     */
    applyLayout() {
        if (Object.keys(this.layoutConfig).length === 0) return;

        Object.entries(this.layoutConfig).forEach(([id, config]) => {
            const element = document.getElementById(id);
            if (element && config) {
                if (config.width) element.style.width = config.width;
                if (config.height) element.style.height = config.height;
            }
        });
    }

    /**
     * Reset layout to default
     */
    resetLayout() {
        if (confirm('Reset layout to default? This will clear all customizations.')) {
            localStorage.removeItem('uiLayout');
            this.layoutConfig = {};
            
            // Remove inline styles
            document.querySelectorAll('[style]').forEach(element => {
                element.style.width = '';
                element.style.height = '';
            });

            alert('Layout reset to default!');
            
            // Reload page to apply defaults
            window.location.reload();
        }
    }
}

// Auto-initialize when UIFramework is available
if (typeof UIFramework !== 'undefined') {
    const originalInit = UIFramework.prototype.setup;
    UIFramework.prototype.setup = function() {
        originalInit.call(this);
        this.customizer = new UICustomizer(this);
        this.customizer.applyLayout();
    };
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UICustomizer;
}
