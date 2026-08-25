/**
 * ============================================
 * سكريبت معالجة تسجيل الدخول
 * ============================================
 */

// التحقق من نوع الصفحة (المحامين أم الموكلين)
const isClientLogin = document.body.classList.contains('clients-login');
const formId = isClientLogin ? 'clientLoginForm' : 'loginForm';
const form = document.getElementById(formId);

// ============================================
// معالجة تسجيل الدخول الأساسي
// ============================================
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const countryCode = document.getElementById('countryCode').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // التحقق من صحة البيانات
        if (!countryCode || !phoneNumber || !password) {
            showAlert('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // التحقق من صيغة رقم الهاتف
        if (!/^\d{7,15}$/.test(phoneNumber)) {
            showAlert('الرجاء إدخال رقم هاتف صحيح', 'error');
            return;
        }
        
        // التحقق من طول كلمة المرور
        if (password.length < 6) {
            showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }
        
        // إظهار حالة التحميل
        showLoading();
        
        // دمج رقم الهاتف مع كود الدولة
        const fullPhone = countryCode + phoneNumber;
        
        // إرسال البيانات إلى الخادم
        sendLoginRequest({
            phone: fullPhone,
            password: password,
            userType: isClientLogin ? 'client' : 'professional',
            rememberMe: rememberMe
        });
    });
}

// ============================================
// معالجة تسجيل الدخول عبر Facebook
// ============================================
const fbLoginBtn = document.getElementById('fbLogin');
if (fbLoginBtn) {
    fbLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        showLoading();
        
        // هنا يتم استدعاء Facebook SDK للمصادقة
        if (typeof FB !== 'undefined') {
            FB.login(function(response) {
                if (response.authResponse) {
                    // تم المصادقة بنجاح
                    handleSocialLogin('facebook', response.authResponse, 'fb_token');
                } else {
                    hideLoading();
                    showAlert('تم إلغاء تسجيل الدخول', 'warning');
                }
            }, {scope: 'public_profile,email'});
        } else {
            // في حالة عدم توفر Facebook SDK، استخدم محاكاة
            simulateSocialLogin('facebook');
        }
    });
}

// ============================================
// معالجة تسجيل الدخول عبر Gmail/Google
// ============================================
const gmailLoginBtn = document.getElementById('gmailLogin');
if (gmailLoginBtn) {
    gmailLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        showLoading();
        
        // هنا يتم استدعاء Google SDK للمصادقة
        if (typeof gapi !== 'undefined' && gapi.auth2) {
            const auth2 = gapi.auth2.getAuthInstance();
            if (auth2) {
                auth2.signIn().then(function(user) {
                    const googleUser = auth2.currentUser.get();
                    const profile = googleUser.getBasicProfile();
                    const authResponse = googleUser.getAuthResponse();
                    
                    handleSocialLogin('google', {
                        id: profile.getId(),
                        email: profile.getEmail(),
                        name: profile.getName(),
                        photo: profile.getImageUrl()
                    }, 'google_token', authResponse.id_token);
                }).catch(function(error) {
                    hideLoading();
                    showAlert('فشل تسجيل الدخول عبر Gmail', 'error');
                });
            } else {
                simulateSocialLogin('google');
            }
        } else {
            // في حالة عدم توفر Google SDK، استخدم محاكاة
            simulateSocialLogin('google');
        }
    });
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * إرسال طلب تسجيل الدخول إلى الخادم
 */
function sendLoginRequest(data) {
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            // حفظ البيانات إذا تم اختيار "تذكر البيانات"
            if (data.rememberMe) {
                localStorage.setItem('savedPhone', data.phone);
                localStorage.setItem('rememberedUser', 'true');
            }
            
            showAlert('تم تسجيل الدخول بنجاح!', 'success');
            
            // إعادة توجيه إلى الصفحة الرئيسية أو لوحة التحكم
            setTimeout(() => {
                window.location.href = data.redirectUrl || '/dashboard';
            }, 1500);
        } else {
            showAlert(data.message || 'فشل تسجيل الدخول', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        showAlert('حدث خطأ في الاتصال بالخادم', 'error');
    });
}

/**
 * معالجة تسجيل الدخول عبر وسائل التواصل
 */
function handleSocialLogin(provider, userInfo, tokenKey, idToken = null) {
    const data = {
        provider: provider,
        userInfo: userInfo,
        userType: isClientLogin ? 'client' : 'professional',
        [tokenKey]: idToken || userInfo.accessToken
    };
    
    fetch('/api/social-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            showAlert('تم تسجيل الدخول بنجاح!', 'success');
            
            setTimeout(() => {
                window.location.href = data.redirectUrl || '/dashboard';
            }, 1500);
        } else {
            showAlert(data.message || 'فشل تسجيل الدخول', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        showAlert('حدث خطأ في عملية تسجيل الدخول', 'error');
    });
}

/**
 * محاكاة تسجيل الدخول عبر وسائل التواصل (للاختبار)
 */
function simulateSocialLogin(provider) {
    const providerName = provider === 'facebook' ? 'Facebook' : 'Gmail';
    
    showAlert(`تم محاكاة تسجيل الدخول عبر ${providerName}\nفي الإصدار الحقيقي، سيتم التحقق من بيانات ${providerName}`, 'info');
    
    hideLoading();
    
    // هنا يمكن إضافة منطق للاختبار
}

/**
 * عرض تنبيه (Alert)
 */
function showAlert(message, type = 'info') {
    // إنشاء عنصر التنبيه
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        max-width: 400px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        margin: 0 auto;
        text-align: center;
        font-weight: 500;
    `;
    
    // تحديد لون التنبيه بناءً على النوع
    switch(type) {
        case 'success':
            alertDiv.style.background = '#10b981';
            alertDiv.style.color = 'white';
            break;
        case 'error':
            alertDiv.style.background = '#ef4444';
            alertDiv.style.color = 'white';
            break;
        case 'warning':
            alertDiv.style.background = '#f59e0b';
            alertDiv.style.color = 'white';
            break;
        default:
            alertDiv.style.background = '#3b82f6';
            alertDiv.style.color = 'white';
    }
    
    document.body.appendChild(alertDiv);
    
    // حذف التنبيه بعد 4 ثوان
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 4000);
}

/**
 * عرض حالة التحميل
 */
function showLoading() {
    const btn = document.querySelector('.login-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.textContent = 'جاري تسجيل الدخول...';
    }
}

/**
 * إخفاء حالة التحميل
 */
function hideLoading() {
    const btn = document.querySelector('.login-btn');
    if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = 'تسجيل الدخول';
    }
}

/**
 * استعادة البيانات المحفوظة عند تحميل الصفحة
 */
window.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phoneNumber');
    const rememberCheckbox = document.getElementById('rememberMe');
    
    if (phoneInput && rememberCheckbox) {
        const savedPhone = localStorage.getItem('savedPhone');
        const remembered = localStorage.getItem('rememberedUser');
        
        if (saved && remembered === 'true') {
            phoneInput.value = savedPhone;
            rememberCheckbox.checked = true;
        }
    }
});

/**
 * إضافة أنماط الرسوم المتحركة
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
