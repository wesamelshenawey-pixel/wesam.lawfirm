#!/usr/bin/env node

/**
 * تطبيق المحاماة الموحد - خادم Node.js
 * Unified Law Firm Application - Node.js Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// الإعدادات
// ============================================

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, '.')));

// ============================================
// المسارات (Routes)
// ============================================

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// بوابة المحامين
app.get('/professionals-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/professionals-login.html'));
});

// بوابة الموكلين
app.get('/clients-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/clients-login.html'));
});

// ============================================
// API - تسجيل الدخول الأساسي
// ============================================

/**
 * POST /api/login
 * معالجة تسجيل الدخول بالهاتف وكلمة المرور
 */
app.post('/api/login', (req, res) => {
  try {
    const { phone, password, userType, rememberMe } = req.body;

    // التحقق من البيانات
    if (!phone || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة غير مكتملة'
      });
    }

    // التحقق من صيغة رقم الهاتف
    const phoneRegex = /^\+\d{2,3}\d{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'صيغة رقم الهاتف غير صحيحة'
      });
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور قصيرة جداً'
      });
    }

    // تحقق من نوع المستخدم
    if (!['client', 'professional'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع مستخدم غير صحيح'
      });
    }

    // هنا يتم التحقق من البيانات مع قاعدة البيانات
    // في الوقت الحالي، هذا مثال توضيحي فقط

    // محاكاة التحقق الناجح
    const token = Buffer.from(`${phone}:${Date.now()}`).toString('base64');
    
    const redirectUrl = userType === 'professional' 
      ? '/dashboard/professionals' 
      : '/dashboard/clients';

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token: token,
      userType: userType,
      phone: phone,
      redirectUrl: redirectUrl,
      rememberMe: rememberMe
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// ============================================
// API - تسجيل الدخول عبر وسائل التواصل
// ============================================

/**
 * POST /api/social-login
 * معالجة تسجيل الدخول عبر Facebook أو Google
 */
app.post('/api/social-login', (req, res) => {
  try {
    const { provider, userInfo, userType, fb_token, google_token } = req.body;

    // التحقق من البيانات
    if (!provider || !userInfo || !userType) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة غير مكتملة'
      });
    }

    // التحقق من مزود الخدمة
    if (!['facebook', 'google'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'مزود خدمة غير مدعوم'
      });
    }

    // هنا يتم التحقق من التوكن مع الخادم الخاص بـ Facebook أو Google
    // في الوقت الحالي، هذا مثال توضيحي فقط

    const token = Buffer.from(`${provider}:${userInfo.id}:${Date.now()}`).toString('base64');
    
    const redirectUrl = userType === 'professional' 
      ? '/dashboard/professionals' 
      : '/dashboard/clients';

    res.json({
      success: true,
      message: `تم تسجيل الدخول عبر ${provider} بنجاح`,
      token: token,
      userType: userType,
      provider: provider,
      userInfo: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      },
      redirectUrl: redirectUrl
    });

  } catch (error) {
    console.error('Social Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في عملية تسجيل الدخول'
    });
  }
});

// ============================================
// API - التحقق من صحة البيانات
// ============================================

/**
 * POST /api/validate-phone
 * التحقق من أن رقم الهاتف مسجل في النظام
 */
app.post('/api/validate-phone', (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف مطلوب'
      });
    }

    // محاكاة التحقق
    const isRegistered = true; // يتم الحصول على هذا من قاعدة البيانات

    res.json({
      success: true,
      isRegistered: isRegistered,
      message: isRegistered ? 'الحساب موجود' : 'الحساب غير موجود'
    });

  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق'
    });
  }
});

// ============================================
// معالجة الأخطاء
// ============================================

// 404 Error
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ============================================
// بدء الخادم
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   تطبيق المحاماة الموحد                    ║
║   Unified Law Firm Application             ║
╚════════════════════════════════════════════╝

🚀 الخادم يعمل على: http://localhost:${PORT}
📱 الصفحة الرئيسية: http://localhost:${PORT}/
🔐 بوابة المحامين: http://localhost:${PORT}/professionals-login
👤 بوابة الموكلين: http://localhost:${PORT}/clients-login

💡 البيئة: ${process.env.NODE_ENV || 'development'}
  `);
});

// معالجة الأخطاء غير المكتشفة
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
