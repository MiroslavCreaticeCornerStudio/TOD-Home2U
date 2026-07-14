// Ported verbatim from the Webflow export index.html inline <script> block.
import tippy from "tippy.js";

function initAdvancedFormValidation() {
        const forms = document.querySelectorAll('[data-form-validate]');
        forms.forEach((formContainer) => {
            // Configuration constants
            const SPAM_PREVENTION_TIMEOUT = 5000;
            const VALIDATION_PATTERNS = {
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                phone: /^(\+?\d{7,15})$/
            };
            const INVALID_SELECT_VALUES = ['', 'disabled', 'null', 'false'];
            const startTime = new Date().getTime();
            const form = formContainer.querySelector('form');
            if (!form) return;
            const validateFields = form.querySelectorAll('[data-validate]');
            const dataSubmit = form.querySelector('[data-submit]');
            if (!dataSubmit) return;
            const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
            if (!realSubmitInput) return;
            // DOM Cache using WeakMap for automatic memory management
            const fieldDataMap = new WeakMap();
            function isSpam() {
                const currentTime = new Date().getTime();
                return currentTime - startTime < SPAM_PREVENTION_TIMEOUT;
            }
            // Cache field data to avoid repeated DOM queries
            function getFieldData(fieldGroup) {
                if (!fieldDataMap.has(fieldGroup)) {
                    const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
                    const data = {
                        radioCheckGroup,
                        input: radioCheckGroup ? null : fieldGroup.querySelector('input, textarea, select'),
                        radioCheckboxInputs: radioCheckGroup ? radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]') : null,
                        min: null,
                        max: null,
                        type: null
                    };
                    // Cache validation parameters
                    if (data.radioCheckGroup) {
                        const minAttr = data.radioCheckGroup.getAttribute('min');
                        data.min = minAttr !== null ? parseInt(minAttr) : 1;
                        data.max = parseInt(data.radioCheckGroup.getAttribute('max')) || data.radioCheckboxInputs.length;
                        data.type = data.radioCheckboxInputs[0]?.type;
                    } else if (data.input) {
                        data.min = parseInt(data.input.getAttribute('min')) || 0;
                        data.max = parseInt(data.input.getAttribute('max')) || Infinity;
                        data.type = data.input.type;
                    }
                    fieldDataMap.set(fieldGroup, data);
                }
                return fieldDataMap.get(fieldGroup);
            }
            // Specific validators for different input types
            const validators = {
                email: (value) => VALIDATION_PATTERNS.email.test(value),
                tel: (value) => {
                    const cleanPhone = value.replace(/[^\d+]/g, '');
                    return VALIDATION_PATTERNS.phone.test(cleanPhone) && cleanPhone.length >= 7;
                },
                select: (value) => !INVALID_SELECT_VALUES.includes(value),
                text: (value, min, max) => {
                    const length = value.length;
                    if (min && length < min) return false;
                    if (max !== Infinity && length > max) return false;
                    return true;
                },
                radioCheckbox: (checkedCount, min, max, isRadio, isSingle) => {
                    if (isRadio) return checkedCount >= min;
                    if (isSingle) return checkedCount === 1;
                    return checkedCount >= min && checkedCount <= max;
                }
            };
            // Disable select options with invalid values on page load
            validateFields.forEach(function (fieldGroup) {
                const select = fieldGroup.querySelector('select');
                if (select) {
                    const options = select.querySelectorAll('option');
                    options.forEach(function (option) {
                        if (INVALID_SELECT_VALUES.includes(option.value)) {
                            option.setAttribute('disabled', 'disabled');
                        }
                    });
                }
            });
            function validateAndStartLiveValidationForAll() {
                let allValid = true;
                let firstInvalidField = null;
                validateFields.forEach(function (fieldGroup) {
                    const fieldData = getFieldData(fieldGroup);
                    const input = fieldData.input;
                    const radioCheckGroup = fieldData.radioCheckGroup;
                    if (!input && !radioCheckGroup) return;
                    if (input) input.__validationStarted = true;
                    if (radioCheckGroup) {
                        radioCheckGroup.__validationStarted = true;
                        fieldData.radioCheckboxInputs.forEach(function (input) {
                            input.__validationStarted = true;
                        });
                    }
                    updateFieldStatus(fieldGroup);
                    if (!isValid(fieldGroup)) {
                        allValid = false;
                        if (!firstInvalidField) {
                            firstInvalidField = input || radioCheckGroup.querySelector('input');
                        }
                    }
                });
                if (!allValid && firstInvalidField) {
                    firstInvalidField.focus();
                }
                return allValid;
            }
            // Refactored validation function using cached data and specific validators
            function isValid(fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                if (fieldData.radioCheckGroup) {
                    const checkedCount = fieldData.radioCheckGroup.querySelectorAll('input:checked').length;
                    const isRadio = fieldData.type === 'radio';
                    const isSingle = fieldData.radioCheckboxInputs.length === 1;
                    return validators.radioCheckbox(
                        checkedCount,
                        fieldData.min,
                        fieldData.max,
                        isRadio,
                        isSingle
                    );
                }
                const input = fieldData.input;
                if (!input) return false;
                const value = input.value.trim();
                const inputType = input.tagName.toLowerCase() === 'select' ? 'select' : input.type;
                // Use specific validator or fall back to text validator
                const validator = validators[inputType] || validators.text;
                return inputType === 'select' || inputType === 'email' || inputType === 'tel'
                    ? validator(value)
                    : validator(value, fieldData.min, fieldData.max);
            }
            // Generate contextual error messages for tooltips
            function getErrorMessage(fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                if (fieldData.radioCheckGroup) {
                    const checkedCount = fieldData.radioCheckGroup.querySelectorAll('input:checked').length;
                    const isRadio = fieldData.type === 'radio';
                    const isSingle = fieldData.radioCheckboxInputs.length === 1;
                    if (isSingle) {
                        return 'This field is required';
                    }
                    if (isRadio) {
                        return 'Please select an option';
                    }
                    if (checkedCount < fieldData.min) {
                        return `Please select at least ${fieldData.min} option${fieldData.min > 1 ? 's' : ''}`;
                    }
                    if (checkedCount > fieldData.max) {
                        return `Please select no more than ${fieldData.max} option${fieldData.max > 1 ? 's' : ''}`;
                    }
                    return 'Please select an option';
                }
                const input = fieldData.input;
                if (!input) return 'This field is invalid';
                const value = input.value.trim();
                const inputType = input.tagName.toLowerCase() === 'select' ? 'select' : input.type;
                // Type-specific error messages
                if (inputType === 'email') {
                    return 'Please enter a valid email address';
                }
                if (inputType === 'tel') {
                    return 'Please enter a valid phone number';
                }
                if (inputType === 'select') {
                    return 'Please select an option';
                }
                // Text/textarea validation messages
                if (fieldData.min && value.length < fieldData.min) {
                    return `Minimum ${fieldData.min} character${fieldData.min > 1 ? 's' : ''} required`;
                }
                if (fieldData.max !== Infinity && value.length > fieldData.max) {
                    return `Maximum ${fieldData.max} character${fieldData.max > 1 ? 's' : ''} allowed`;
                }
                return 'This field is required';
            }
            // Tippy.js Tooltip Configuration - Customize error tooltip appearance here
            const tippyConfig = {
                allowHTML: true,                    // Allow HTML in tooltip content
                placement: 'top',                   // Options: 'top', 'bottom', 'left', 'right', 'auto'
                animation: 'shift-away',            // Options: 'shift-away', 'shift-toward', 'scale', 'fade'
                theme: 'light',                     // Options: 'light', 'dark', 'translucent', 'material' (requires theme CSS)
                trigger: 'mouseenter focus',        // Options: 'mouseenter', 'focus', 'click', 'manual'
                interactive: false,                 // Set to true to allow hovering over tooltip
                maxWidth: 260,                      // Maximum width in pixels
                delay: [100, 0],                    // [show delay, hide delay] in milliseconds
            };
            // Helper function to update validation state classes
            function setValidationState(fieldGroup, isValid, hasStarted) {
                if (isValid) {
                    fieldGroup.classList.add('is--success');
                    fieldGroup.classList.remove('is--error');
                } else {
                    fieldGroup.classList.remove('is--success');
                    if (hasStarted) {
                        fieldGroup.classList.add('is--error');
                        // Update Tippy content with contextual error message
                        const errorIcon = fieldGroup.querySelector('.form-field-icon.is--error, .radiocheck-field-icon.is--error');
                        if (errorIcon) {
                            const errorMessage = getErrorMessage(fieldGroup);
                            // Initialize Tippy if it doesn't exist yet
                            if (!errorIcon._tippy) {
                                tippy(errorIcon, {
                                    ...tippyConfig,
                                    content: errorMessage
                                });
                            } else {
                                // Update existing Tippy content
                                errorIcon._tippy.setContent(errorMessage);
                            }
                        }
                    } else {
                        fieldGroup.classList.remove('is--error');
                    }
                }
            }
            function updateFieldStatus(fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                if (fieldData.radioCheckGroup) {
                    const checkedInputs = fieldData.radioCheckGroup.querySelectorAll('input:checked');
                    // Update filled state
                    fieldGroup.classList.toggle('is--filled', checkedInputs.length > 0);
                    // Update validation state
                    const valid = isValid(fieldGroup);
                    const anyInputValidationStarted = Array.from(fieldData.radioCheckboxInputs).some(
                        input => input.__validationStarted
                    );
                    setValidationState(fieldGroup, valid, anyInputValidationStarted);
                } else {
                    const input = fieldData.input;
                    if (!input) return;
                    const value = input.value.trim();
                    // Update filled state
                    fieldGroup.classList.toggle('is--filled', !!value);
                    // Update validation state
                    const valid = isValid(fieldGroup);
                    setValidationState(fieldGroup, valid, input.__validationStarted);
                }
            }
            // Phone input character filtering constants
            const CONTROL_KEYS = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
                                  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
            const PHONE_ALLOWED_CHARS = /[0-9+\-() ]/;
            const PHONE_CLEANUP_PATTERN = /[^0-9+\-() ]/g;
            validateFields.forEach(function (fieldGroup) {
                const fieldData = getFieldData(fieldGroup);
                const input = fieldData.input;
                const radioCheckGroup = fieldData.radioCheckGroup;
                if (radioCheckGroup) {
                    fieldData.radioCheckboxInputs.forEach(function (input) {
                        input.__validationStarted = false;
                        input.addEventListener('change', function () {
                            requestAnimationFrame(function () {
                                if (!input.__validationStarted) {
                                    const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
                                    // Start validation when min requirement is met, or immediately if min=0 (optional)
                                    if (checkedCount >= fieldData.min || fieldData.min === 0) {
                                        input.__validationStarted = true;
                                    }
                                }
                                if (input.__validationStarted) {
                                    updateFieldStatus(fieldGroup);
                                }
                            });
                        });
                        input.addEventListener('blur', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    });
                } else if (input) {
                    input.__validationStarted = false;
                    // Phone input specific handling
                    if (input.type === 'tel') {
                        // Prevent typing invalid characters
                        input.addEventListener('keydown', function (e) {
                            // Allow control keys
                            if (CONTROL_KEYS.includes(e.key)) {
                                return;
                            }
                            // Allow Ctrl/Cmd shortcuts
                            if ((e.ctrlKey || e.metaKey) && /^[acvxACVX]$/.test(e.key)) {
                                return;
                            }
                            // Allow only valid phone characters
                            if (!PHONE_ALLOWED_CHARS.test(e.key)) {
                                e.preventDefault();
                            }
                        });
                        // Clean pasted content
                        input.addEventListener('input', function (e) {
                            const cursorPos = input.selectionStart;
                            const oldValue = input.value;
                            const newValue = oldValue.replace(PHONE_CLEANUP_PATTERN, '');
                            if (oldValue !== newValue) {
                                input.value = newValue;
                                input.setSelectionRange(cursorPos - 1, cursorPos - 1);
                            }
                        });
                    }
                    // Validation event listeners
                    if (input.tagName.toLowerCase() === 'select') {
                        input.addEventListener('change', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    } else {
                        input.addEventListener('input', function () {
                            const value = input.value.trim();
                            const length = value.length;
                            if (!input.__validationStarted) {
                                // Start validation based on input type
                                if (input.type === 'email' || input.type === 'tel') {
                                    if (isValid(fieldGroup)) {
                                        input.__validationStarted = true;
                                    }
                                } else {
                                    if ((input.hasAttribute('min') && length >= fieldData.min) ||
                                        (input.hasAttribute('max') && length <= fieldData.max)) {
                                        input.__validationStarted = true;
                                    }
                                }
                            }
                            if (input.__validationStarted) {
                                updateFieldStatus(fieldGroup);
                            }
                        }, { capture: false });
                        input.addEventListener('blur', function () {
                            input.__validationStarted = true;
                            updateFieldStatus(fieldGroup);
                        });
                    }
                }
            });
            dataSubmit.addEventListener('click', function () {
                if (validateAndStartLiveValidationForAll()) {
                    if (isSpam()) {
                        alert('Form submitted too quickly. Please try again.');
                        return;
                    }
                    realSubmitInput.click();
                }
            });
            form.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    if (validateAndStartLiveValidationForAll()) {
                        if (isSpam()) {
                            alert('Form submitted too quickly. Please try again.');
                            return;
                        }
                        realSubmitInput.click();
                    }
                }
            });
        });
    }
    // Initialize Advanced Form Validation
    document.addEventListener('DOMContentLoaded', () => {
        initAdvancedFormValidation();
    });
