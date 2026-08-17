// Fallback in-memory data store when MongoDB local server is unavailable
export const fallbackStore = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      passwordHash: '$2a$10$T6ZH0qweQjkoklE8ZaDKluZD8BnDcsnmtR11CroNW5gXw1UAIAMme', // admin123
      fullName: 'Quản trị viên Hệ thống',
      email: 'admin@genetrust.vn',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_staff',
      username: 'nhanvien',
      passwordHash: '$2a$10$T6ZH0qweQjkoklE8ZaDKluZD8BnDcsnmtR11CroNW5gXw1UAIAMme', // admin123
      fullName: 'Kỹ thuật viên XN',
      email: 'ktv@genetrust.vn',
      role: 'staff',
      createdAt: new Date().toISOString()
    }
  ],
  samples: [] // XÓA SẠCH DỮ LIỆU MẪU MẶC ĐỊNH
};
