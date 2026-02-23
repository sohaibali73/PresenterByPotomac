/**
 * Internationalization (i18n) for Potomac Presenter
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar';

export const LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Translation strings
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    'app.title': 'Potomac Presenter',
    'app.tagline': 'AI-Powered Presentation Generator',
    'common.generate': 'Generate',
    'common.download': 'Download',
    'common.export': 'Export',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.preview': 'Preview',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot password?',
    'auth.loginTitle': 'Sign in to your account',
    'auth.registerTitle': 'Create an account',
    
    // Generator
    'generator.title': 'Create Presentation',
    'generator.topic': 'Topic or Title',
    'generator.topicPlaceholder': 'Enter your presentation topic...',
    'generator.slideCount': 'Number of slides',
    'generator.theme': 'Theme',
    'generator.strategy': 'Strategy',
    'generator.generating': 'Generating presentation...',
    'generator.generated': 'Presentation generated!',
    
    // Editor
    'editor.title': 'Edit Presentation',
    'editor.addSlide': 'Add Slide',
    'editor.removeSlide': 'Remove Slide',
    'editor.duplicateSlide': 'Duplicate Slide',
    'editor.reorder': 'Reorder Slides',
    'editor.slideTitle': 'Slide Title',
    'editor.slideContent': 'Slide Content',
    'editor.speakerNotes': 'Speaker Notes',
    
    // Templates
    'templates.title': 'Templates',
    'templates.select': 'Select Template',
    'templates.customize': 'Customize',
    'templates.createFromPdf': 'Create from PDF',
    'templates.uploadPdf': 'Upload PDF',
    
    // Assets
    'assets.title': 'Asset Library',
    'assets.upload': 'Upload Asset',
    'assets.logos': 'Logos',
    'assets.images': 'Images',
    'assets.delete': 'Delete Asset',
    
    // Export
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'PDF Document',
    'export.images': 'Slide Images (ZIP)',
    'export.downloading': 'Preparing download...',
    
    // Presentation Mode
    'present.start': 'Start Presentation',
    'present.exit': 'Exit Presentation',
    'present.next': 'Next Slide',
    'present.previous': 'Previous Slide',
    'present.notes': 'Speaker Notes',
    'present.laser': 'Laser Pointer',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.overview': 'Overview',
    'analytics.events': 'Events',
    'analytics.charts': 'Charts',
    'analytics.totalEvents': 'Total Events',
    'analytics.generated': 'Generated',
    'analytics.downloaded': 'Downloaded',
    'analytics.errors': 'Errors',
    
    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.darkMode': 'Dark Mode',
    'settings.lightMode': 'Light Mode',
    'settings.systemTheme': 'System',
    
    // Errors
    'error.generic': 'Something went wrong',
    'error.network': 'Network error. Please check your connection.',
    'error.unauthorized': 'You are not authorized to perform this action.',
    'error.notFound': 'Resource not found.',
  },
  
  es: {
    'app.title': 'Potomac Presenter',
    'app.tagline': 'Generador de Presentaciones con IA',
    'common.generate': 'Generar',
    'common.download': 'Descargar',
    'common.export': 'Exportar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.preview': 'Vista previa',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'auth.login': 'Iniciar sesión',
    'auth.logout': 'Cerrar sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.register': 'Registrarse',
    'auth.loginTitle': 'Inicia sesión en tu cuenta',
    'auth.registerTitle': 'Crear una cuenta',
    'generator.title': 'Crear Presentación',
    'generator.topic': 'Tema o Título',
    'generator.topicPlaceholder': 'Ingresa tu tema de presentación...',
    'generator.slideCount': 'Número de diapositivas',
    'generator.theme': 'Tema',
    'generator.generating': 'Generando presentación...',
    'generator.generated': '¡Presentación generada!',
    'editor.title': 'Editar Presentación',
    'editor.addSlide': 'Añadir Diapositiva',
    'editor.removeSlide': 'Eliminar Diapositiva',
    'templates.title': 'Plantillas',
    'assets.title': 'Biblioteca de Recursos',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'Documento PDF',
    'present.start': 'Iniciar Presentación',
    'present.exit': 'Salir de la Presentación',
    'settings.title': 'Configuración',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'error.generic': 'Algo salió mal',
  },
  
  fr: {
    'app.title': 'Potomac Presenter',
    'app.tagline': 'Générateur de Présentations IA',
    'common.generate': 'Générer',
    'common.download': 'Télécharger',
    'common.export': 'Exporter',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.preview': 'Aperçu',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.register': "S'inscrire",
    'generator.title': 'Créer une Présentation',
    'generator.topic': 'Sujet ou Titre',
    'generator.generating': 'Génération en cours...',
    'templates.title': 'Modèles',
    'assets.title': 'Bibliothèque de Ressources',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'Document PDF',
    'present.start': 'Démarrer la Présentation',
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'error.generic': 'Une erreur est survenue',
  },
  
  de: {
    'app.title': 'Potomac Presenter',
    'app.tagline': 'KI-Präsentationsgenerator',
    'common.generate': 'Generieren',
    'common.download': 'Herunterladen',
    'common.export': 'Exportieren',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.preview': 'Vorschau',
    'common.close': 'Schließen',
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'auth.login': 'Anmelden',
    'auth.logout': 'Abmelden',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.register': 'Registrieren',
    'generator.title': 'Präsentation Erstellen',
    'generator.topic': 'Thema oder Titel',
    'generator.generating': 'Präsentation wird generiert...',
    'templates.title': 'Vorlagen',
    'assets.title': 'Asset-Bibliothek',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'PDF-Dokument',
    'present.start': 'Präsentation Starten',
    'settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'error.generic': 'Etwas ist schief gelaufen',
  },
  
  zh: {
    'app.title': 'Potomac 演示文稿',
    'app.tagline': 'AI驱动的演示文稿生成器',
    'common.generate': '生成',
    'common.download': '下载',
    'common.export': '导出',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.preview': '预览',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'auth.login': '登录',
    'auth.logout': '登出',
    'auth.email': '电子邮件',
    'auth.password': '密码',
    'auth.register': '注册',
    'generator.title': '创建演示文稿',
    'generator.topic': '主题或标题',
    'generator.generating': '正在生成演示文稿...',
    'templates.title': '模板',
    'assets.title': '素材库',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'PDF文档',
    'present.start': '开始演示',
    'settings.title': '设置',
    'settings.language': '语言',
    'error.generic': '出错了',
  },
  
  ja: {
    'app.title': 'Potomac プレゼンター',
    'app.tagline': 'AI搭載プレゼンテーションジェネレーター',
    'common.generate': '生成',
    'common.download': 'ダウンロード',
    'common.export': 'エクスポート',
    'common.cancel': 'キャンセル',
    'common.save': '保存',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.preview': 'プレビュー',
    'common.close': '閉じる',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'auth.login': 'ログイン',
    'auth.logout': 'ログアウト',
    'auth.email': 'メール',
    'auth.password': 'パスワード',
    'auth.register': '登録',
    'generator.title': 'プレゼンテーション作成',
    'generator.topic': 'トピックまたはタイトル',
    'generator.generating': 'プレゼンテーションを生成中...',
    'templates.title': 'テンプレート',
    'assets.title': 'アセットライブラリ',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'PDFドキュメント',
    'present.start': 'プレゼンテーション開始',
    'settings.title': '設定',
    'settings.language': '言語',
    'error.generic': 'エラーが発生しました',
  },
  
  ar: {
    'app.title': 'Potomac Presenter',
    'app.tagline': 'مولد العروض التقديمية بالذكاء الاصطناعي',
    'common.generate': 'إنشاء',
    'common.download': 'تحميل',
    'common.export': 'تصدير',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.preview': 'معاينة',
    'common.close': 'إغلاق',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.register': 'التسجيل',
    'generator.title': 'إنشاء عرض تقديمي',
    'generator.topic': 'الموضوع أو العنوان',
    'generator.generating': 'جاري إنشاء العرض التقديمي...',
    'templates.title': 'القوالب',
    'assets.title': 'مكتبة الأصول',
    'export.pptx': 'PowerPoint (PPTX)',
    'export.pdf': 'مستند PDF',
    'present.start': 'بدء العرض التقديمي',
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'error.generic': 'حدث خطأ',
  },
};

// Default locale
const DEFAULT_LOCALE: Locale = 'en';

/**
 * Get a translation string
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const localeStrings = translations[locale] || translations[DEFAULT_LOCALE];
  return localeStrings[key] || translations[DEFAULT_LOCALE][key] || key;
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Record<string, string> {
  return translations[locale] || translations[DEFAULT_LOCALE];
}

/**
 * Check if a locale is RTL (Right-to-Left)
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export default {
  t,
  getTranslations,
  isRTL,
  getDirection,
  LOCALES,
  DEFAULT_LOCALE,
};