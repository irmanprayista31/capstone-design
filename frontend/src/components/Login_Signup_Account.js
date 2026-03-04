import { useState, useEffect } from 'react';

// ======== Hook untuk validasi nama lengkap =========
export const useFullNameValidation = (translations) => {
    const [fullName, setFullName] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [isFullNameValid, setIsFullNameValid] = useState(false);
    const [fullNameErrorType, setFullNameErrorType] = useState('');

    const validateFullName = (nameValue) => {
        if (!nameValue.trim()) {
            setFullNameError('');
            setFullNameErrorType('');
            setIsFullNameValid(false);
        } else if (nameValue.trim().length < 2) {
            setFullNameError(translations.namaMinimal2);
            setFullNameErrorType('namaMinimal2');
            setIsFullNameValid(false);
        } else if (nameValue.trim().length > 50) {
            setFullNameError(translations.namaMaksimal50);
            setFullNameErrorType('namaMaksimal50');
            setIsFullNameValid(false);
        } else if (!/^[a-zA-Z\s'.-]+$/.test(nameValue)) {
            setFullNameError(translations.namaHurufSaja);
            setFullNameErrorType('namaHurufSaja');
            setIsFullNameValid(false);
        } else if (/^\s|\s$/.test(nameValue)) {
            setFullNameError(translations.namaTidakSpasiAwalAkhir);
            setFullNameErrorType('namaTidakSpasiAwalAkhir');
            setIsFullNameValid(false);
        } else if (/\s{2,}/.test(nameValue)) {
            setFullNameError(translations.namaTidakSpasiGanda);
            setFullNameErrorType('namaTidakSpasiGanda');
            setIsFullNameValid(false);
        } else {
            setFullNameError('');
            setFullNameErrorType('');
            setIsFullNameValid(true);
        }
    };

    const handleFullNameChange = (e) => {
        const nameValue = e.target.value;
        setFullName(nameValue);
        validateFullName(nameValue);
    };

    return {
        fullName,
        fullNameError,
        isFullNameValid,
        fullNameErrorType,
        handleFullNameChange,
        setFullNameError,
        setFullNameErrorType
    };
};
// ============================================

// ========== Hook untuk validasi nomor telepon ===========
export const usePhoneValidation = (translations) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [phoneErrorType, setPhoneErrorType] = useState('');
    const [isPhoneValid, setIsPhoneValid] = useState(false);

    const validatePhoneNumber = (phoneValue) => {
        if (!phoneValue) {
            setPhoneError('');
            setPhoneErrorType('');
            setIsPhoneValid(false);
        } else if (!/^\d+$/.test(phoneValue)) {
            setPhoneError(translations.nomorTeleponAngka);
            setPhoneErrorType('nomorTeleponAngka');
            setIsPhoneValid(false);
        } else if (phoneValue.length < 9 || phoneValue.length > 13) {
            setPhoneError(translations.nomorTeleponPanjang);
            setPhoneErrorType('nomorTeleponPanjang');
            setIsPhoneValid(false);
        } else if (!phoneValue.startsWith('8')) {
            setPhoneError(translations.nomorTeleponFormat);
            setPhoneErrorType('nomorTeleponFormat');
            setIsPhoneValid(false);
        } else {
            setPhoneError('');
            setPhoneErrorType('');
            setIsPhoneValid(true);
        }
    };

    const handlePhoneChange = (e) => {
        const phoneValue = e.target.value;
        setPhoneNumber(phoneValue);
        validatePhoneNumber(phoneValue);
    };

    return {
        phoneNumber,
        phoneError,
        phoneErrorType,
        isPhoneValid,
        handlePhoneChange,
        setPhoneError,
        setPhoneErrorType
    };
};
// ==============================================

// =========== Hook untuk validasi email =============
export const useEmailValidation = (translations) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [errorType, setErrorType] = useState('');

    const commonEmailDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'yahoo.co.id', 'ymail.com', 'live.com', 'icloud.com'
    ];

    const checkEmailTypo = (email) => {
        if (!email.includes('@')) return false;
        const [, domain] = email.split('@');
        const lowerDomain = domain.toLowerCase();
        const isValidDomain = commonEmailDomains.includes(lowerDomain);
        if (!isValidDomain) {
            return {
                hasTypo: true,
                message: translations.formatTidakValidEmail
            };
        }
        return false;
    };

    const validateEmail = (emailValue) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(emailValue);
        
        if (!emailValue) {
            setEmailError('');
            setIsEmailValid(false);
            setErrorType('');
        } else if (!isValidFormat) {
            if (!emailValue.includes('@')) {
                setEmailError(translations.simbolEmail);
                setErrorType('simbolEmail');
            } else if (emailValue.split('@').length > 2) {
                setEmailError(translations.satuSimbolEmail);
                setErrorType('satuSimbolEmail');
            } else if (!emailValue.includes('.') || emailValue.split('@')[1]?.split('.').length < 2) {
                setEmailError(translations.domainTitikEmail);
                setErrorType('domainTitikEmail');
            } else if (emailValue.startsWith('@') || emailValue.endsWith('@')) {
                setEmailError(translations.awalAkhirEmail);
                setErrorType('awalAkhirEmail');
            } else if (emailValue.includes('..')) {
                setEmailError(translations.titikGandaEmail);
                setErrorType('titikGandaEmail');
            } else if (emailValue.includes('  ')) {
                setEmailError(translations.tidakSpasiEmail);
                setErrorType('tidakSpasiEmail');
            } else {
                setEmailError(translations.formatTidakValidEmail);
                setErrorType('formatTidakValidEmail');
            }
            setIsEmailValid(false);
        } else {
            const typoInfo = checkEmailTypo(emailValue);
            if (typoInfo && typoInfo.hasTypo) {
                setEmailError(typoInfo.message);
                setErrorType('formatTidakValidEmail');
                setIsEmailValid(false);
            } else {
                setEmailError('');
                setErrorType('');
                setIsEmailValid(true);
            }
        }
    };

    const handleEmailChange = (e) => {
        const emailValue = e.target.value;
        setEmail(emailValue);
        validateEmail(emailValue);
    };

    return {
        email,
        emailError,
        isEmailValid,
        errorType,
        handleEmailChange,
        setEmailError,
        setErrorType
    };
};
// =============================================

// ============ Hook untuk validasi password ==============
export const usePasswordValidation = (translations, email = '') => {
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [passwordErrorType, setPasswordErrorType] = useState('');
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        symbol: false,
        notCommon: false,
        noSpaces: false
    });

    const commonPasswords = [
        'password', 'password123', 'qwerty', 'qwerty123', '123456', '123456789',
        'admin', 'admin123', 'abc123', 'password1', 'welcome', 'welcome123',
        'letmein', 'monkey', 'dragon', 'sunshine', 'master', 'hello', 'freedom',
        'whatever', 'qazwsx', 'trustno1', 'jordan', 'harley', 'robert', 'matthew',
        'jordan23', 'daniel', 'andrew', 'joshua', 'hunter', 'target123', 'baseball',
        'soccer', 'charlie', 'jordan1', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
    ];

    const validatePassword = (passwordValue) => {
        const requirements = {
            length: passwordValue.length >= 8,
            uppercase: /[A-Z]/.test(passwordValue),
            lowercase: /[a-z]/.test(passwordValue),
            number: /[0-9]/.test(passwordValue),
            symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(passwordValue),
            notCommon: !commonPasswords.includes(passwordValue.toLowerCase()),
            noSpaces: !passwordValue.startsWith('  ') && !passwordValue.endsWith('  ')
        };

        setPasswordRequirements(requirements);

        if (!passwordValue) {
            setPasswordError('');
            setPasswordErrorType('');
            setIsPasswordValid(false);
            return;
        }

        if (!requirements.length) {
            setPasswordError(translations.passwordMinimal8);
            setPasswordErrorType('length');
            setIsPasswordValid(false);
            return;
        }

        if (!requirements.noSpaces) {
            setPasswordError(translations.passwordTidakSpasi);
            setPasswordErrorType('noSpaces');
            setIsPasswordValid(false);
            return;
        }

        if (!requirements.notCommon) {
            setPasswordError(translations.passwordTidakUmum);
            setPasswordErrorType('notCommon');
            setIsPasswordValid(false);
            return;
        }

        const characterTypes = [
            requirements.uppercase,
            requirements.lowercase,
            requirements.number,
            requirements.symbol
        ];
        const validTypes = characterTypes.filter(Boolean).length;

        if (validTypes < 3) {
            setPasswordError(translations.passwordKombinasi);
            setPasswordErrorType('combination');
            setIsPasswordValid(false);
            return;
        }

        if (email && passwordValue.toLowerCase() === email.toLowerCase()) {
            setPasswordError(translations.passwordSamaEmail);
            setPasswordErrorType('sameAsEmail');
            setIsPasswordValid(false);
            return;
        }

        setPasswordError('');
        setPasswordErrorType('');
        setIsPasswordValid(true);
    };

    const handlePasswordChange = (e) => {
        const passwordValue = e.target.value;
        setPassword(passwordValue);
        validatePassword(passwordValue);
    };

    const getPasswordStrength = () => {
        const score = Object.values(passwordRequirements).filter(Boolean).length;
        if (score < 4) return { text: translations.passwordLemah };
        if (score < 5) return { text: translations.passwordSedang };
        if (score < 7) return { text: translations.passwordKuat };
        return { text: translations.passwordSangatKuat };
    };

    return {
        password,
        passwordError,
        isPasswordValid,
        passwordErrorType,
        passwordRequirements,
        handlePasswordChange,
        getPasswordStrength,
        setPasswordError,
        setPasswordErrorType
    };
};
// ==================================================

// ======== Hook utama untuk form pendaftaran akun =========
export const useSignupForm = (translations) => {
    const fullNameValidation = useFullNameValidation(translations);
    const phoneValidation = usePhoneValidation(translations);
    const emailValidation = useEmailValidation(translations);
    const passwordValidation = usePasswordValidation(translations, emailValidation.email);

    useEffect(() => {
        if (fullNameValidation.fullNameErrorType) {
            switch (fullNameValidation.fullNameErrorType) {
                case 'namaMinimal2':
                    fullNameValidation.setFullNameError(translations.namaMinimal2);
                    break;
                case 'namaMaksimal50':
                    fullNameValidation.setFullNameError(translations.namaMaksimal50);
                    break;
                case 'namaHurufSaja':
                    fullNameValidation.setFullNameError(translations.namaHurufSaja);
                    break;
                case 'namaTidakSpasiAwalAkhir':
                    fullNameValidation.setFullNameError(translations.namaTidakSpasiAwalAkhir);
                    break;
                case 'namaTidakSpasiGanda':
                    fullNameValidation.setFullNameError(translations.namaTidakSpasiGanda);
                    break;
                default:
                    break;
            }
        }

        if (phoneValidation.phoneErrorType) {
            switch (phoneValidation.phoneErrorType) {
                case 'nomorTeleponAngka':
                    phoneValidation.setPhoneError(translations.nomorTeleponAngka);
                    break;
                case 'nomorTeleponPanjang':
                    phoneValidation.setPhoneError(translations.nomorTeleponPanjang);
                    break;
                case 'nomorTeleponFormat':
                    phoneValidation.setPhoneError(translations.nomorTeleponFormat);
                    break;
                default:
                    break;
            }
        }

        if (emailValidation.errorType) {
            switch (emailValidation.errorType) {
                case 'simbolEmail':
                    emailValidation.setEmailError(translations.simbolEmail);
                    break;
                case 'satuSimbolEmail':
                    emailValidation.setEmailError(translations.satuSimbolEmail);
                    break;
                case 'domainTitikEmail':
                    emailValidation.setEmailError(translations.domainTitikEmail);
                    break;
                case 'awalAkhirEmail':
                    emailValidation.setEmailError(translations.awalAkhirEmail);
                    break;
                case 'titikGandaEmail':
                    emailValidation.setEmailError(translations.titikGandaEmail);
                    break;
                case 'tidakSpasiEmail':
                    emailValidation.setEmailError(translations.tidakSpasiEmail);
                    break;
                case 'formatTidakValidEmail':
                    emailValidation.setEmailError(translations.formatTidakValidEmail);
                    break;
                default:
                    break;
            }
        }

        if (passwordValidation.passwordErrorType) {
            switch (passwordValidation.passwordErrorType) {
                case 'length':
                    passwordValidation.setPasswordError(translations.passwordMinimal8);
                    break;
                case 'noSpaces':
                    passwordValidation.setPasswordError(translations.passwordTidakSpasi);
                    break;
                case 'notCommon':
                    passwordValidation.setPasswordError(translations.passwordTidakUmum);
                    break;
                case 'combination':
                    passwordValidation.setPasswordError(translations.passwordKombinasi);
                    break;
                case 'sameAsEmail':
                    passwordValidation.setPasswordError(translations.passwordSamaEmail);
                    break;
                default:
                    break;
            }
        }
    }, [translations]);

    const isFormValid = 
        fullNameValidation.isFullNameValid &&
        phoneValidation.isPhoneValid && 
        emailValidation.isEmailValid && 
        passwordValidation.isPasswordValid;

    return {
        fullName: fullNameValidation,
        phone: phoneValidation,
        email: emailValidation,
        password: passwordValidation,
        isFormValid
    };
};
// ================================================