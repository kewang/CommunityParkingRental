import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English translations
const enResources = {
  translation: {
    // Common
    language: "Language",
    dashboard: "Dashboard",
    parkingSpaces: "Parking Spaces",
    rentals: "Rentals",
    households: "Households",
    reports: "Reports",
    settings: "Settings",
    search: "Search",
    searchPlaceholder: "Search license plate/household...",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    add: "Add",
    close: "Close",
    notes: "Notes",
    status: "Status",
    actions: "Actions",
    admin: "Admin",

    // Statuses
    available: "Available",
    occupied: "Occupied",
    maintenance: "Maintenance",

    // Dashboard
    totalSpaces: "Total Spaces",
    occupiedSpaces: "Occupied",
    availableSpaces: "Available",
    monthlyRentals: "Monthly Rentals",
    parkingOverview: "Parking Overview",
    recentActivity: "Recent Activity",
    expiringSoon: "Expiring Soon",
    since: "since last report",
    percentage: "percentage",
    compared: "compared to last month",
    showMore: "Show more",
    viewAll: "View all",
    remindAll: "Remind all",
    daysUntilExpiry: "days until expiry",
    area: "Area",
    list: "List",

    // Parking spaces
    addParkingSpace: "Add Parking Space",
    spaceNumber: "Space Number",
    areaZone: "Area",
    rentalPeriod: "Rental Period",
    licensePlate: "License Plate",
    householdNumber: "Household Number",
    spaceManagement: "Parking Space Management",

    // Rentals
    newRental: "New Rental",
    startDate: "Start Date",
    endDate: "End Date",
    contact: "Contact",
    rentalAdded: "New rental added",
    rentalEnded: "Rental ended",
    spaceUpdated: "Space information updated",

    // Validation
    required: "This field is required",
    startDateAfterToday: "Start date must be today or later",
    endDateAfterStart: "End date must be after start date",
    duplicateSpaceNumber: "Space number already exists",
    duplicateHouseholdNumber: "Household number already exists",
    spaceNotAvailable: "Space is not available",

    // Notifications
    notificationTitle: "Notification",
    successTitle: "Success",
    errorTitle: "Error",
    warningTitle: "Warning",

    // System messages
    systemTitle: "Taipei Sydney Temporary Parking Rental System",
  },
};

// Chinese translations
const zhResources = {
  translation: {
    // Common
    language: "語言",
    dashboard: "儀表板",
    parkingSpaces: "車位管理",
    rentals: "租借記錄",
    households: "住戶管理",
    reports: "報表",
    settings: "設定",
    search: "搜尋",
    searchPlaceholder: "搜尋車牌/戶號...",
    cancel: "取消",
    save: "儲存",
    edit: "編輯",
    delete: "刪除",
    view: "查看",
    add: "新增",
    close: "關閉",
    notes: "備註",
    status: "狀態",
    actions: "操作",
    admin: "管理員",

    // Statuses
    available: "可用",
    occupied: "已租用",
    maintenance: "維修中",

    // Dashboard
    totalSpaces: "總車位",
    occupiedSpaces: "已租用",
    availableSpaces: "可用車位",
    monthlyRentals: "本月租借",
    parkingOverview: "車位使用概況",
    recentActivity: "近期活動",
    expiringSoon: "到期提醒",
    since: "自上次統計",
    percentage: "占比",
    compared: "相比上月",
    showMore: "顯示更多",
    viewAll: "查看全部",
    remindAll: "提醒全部",
    daysUntilExpiry: "天後到期",
    area: "區域",
    list: "列表",

    // Parking spaces
    addParkingSpace: "新增車位",
    spaceNumber: "車位號碼",
    areaZone: "區域",
    rentalPeriod: "租借期間",
    licensePlate: "車牌號碼",
    householdNumber: "戶號",
    spaceManagement: "車位管理",

    // Rentals
    newRental: "新增租借",
    startDate: "開始日期",
    endDate: "結束日期",
    contact: "聯絡電話",
    rentalAdded: "新增租借",
    rentalEnded: "租約結束",
    spaceUpdated: "車位資訊更新",

    // Validation
    required: "此欄位為必填",
    startDateAfterToday: "開始日期不能早於今天",
    endDateAfterStart: "結束日期必須在開始日期之後",
    duplicateSpaceNumber: "車位號碼已存在",
    duplicateHouseholdNumber: "戶號已存在",
    spaceNotAvailable: "車位不可用",

    // Notifications
    notificationTitle: "通知",
    successTitle: "成功",
    errorTitle: "錯誤",
    warningTitle: "警告",

    // System messages
    systemTitle: "台北雪黎灣停車位短租系統",
  },
};

i18n.use(initReactI18next).init({
  resources: {
    en: enResources,
    zh: zhResources,
  },
  lng: "zh", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
