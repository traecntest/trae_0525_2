const { schemas } = require('../../src/middleware/validator');

describe('Validation Schemas', () => {
  describe('Username Validation', () => {
    const validUsernames = [
      'testuser',
      'test_user123',
      'Test-User',
      'a'.repeat(3),
      'a'.repeat(50),
    ];

    const invalidUsernames = [
      { value: '', error: '不能为空' },
      { value: 'ab', error: '长度不能少于' },
      { value: 'a'.repeat(51), error: '长度不能超过' },
      { value: '123test', error: '用户名格式不正确' },
      { value: 'test@user', error: '用户名格式不正确' },
      { value: 'test user', error: '用户名格式不正确' },
      { value: 'test!user', error: '用户名格式不正确' },
    ];

    test.each(validUsernames)('should accept valid username: %s', (username) => {
      const result = schemas.userCreate.validate({ username, password: 'Test1234', fullName: 'Test User' });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidUsernames)('should reject invalid username: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: value, password: 'Test1234', fullName: 'Test User' });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('Password Validation', () => {
    const validPasswords = [
      'Test1234',
      'test1234',
      'TEST1234',
      'a'.repeat(8),
      'a'.repeat(100),
      'Test1234!@#',
    ];

    const invalidPasswords = [
      { value: '', error: '不能为空' },
      { value: 'short1', error: '长度不能少于' },
      { value: 'a'.repeat(101), error: '长度不能超过' },
      { value: 'onlyletters', error: '密码长度至少' },
      { value: '12345678', error: '密码长度至少' },
    ];

    test.each(validPasswords)('should accept valid password: %s', (password) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password, fullName: 'Test User' });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidPasswords)('should reject invalid password: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: value, fullName: 'Test User' });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('Email Validation', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@domain.com',
      '',
      null,
    ];

    const invalidEmails = [
      { value: 'invalid-email', error: '有效的邮箱' },
      { value: 'test@', error: '有效的邮箱' },
      { value: '@example.com', error: '有效的邮箱' },
      { value: 'a'.repeat(100) + '@example.com', error: '长度不能超过' },
    ];

    test.each(validEmails)('should accept valid email: %s', (email) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', email });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidEmails)('should reject invalid email: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', email: value });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('Phone Validation', () => {
    const validPhones = [
      '13812345678',
      '15912345678',
      '+8613812345678',
      '+1234567890',
      '',
    ];

    const invalidPhones = [
      { value: '12345678', error: '有效的手机' },
      { value: '123456789012345678901', error: '长度不能超过' },
      { value: 'invalid-phone', error: '有效的手机' },
    ];

    test.each(validPhones)('should accept valid phone: %s', (phone) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', phone });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidPhones)('should reject invalid phone: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', phone: value });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('Full Name Validation', () => {
    const validFullNames = [
      'Test User',
      '张三',
      'a'.repeat(100),
    ];

    const invalidFullNames = [
      { value: '', error: '不能为空' },
      { value: 'a'.repeat(101), error: '长度不能超过' },
    ];

    test.each(validFullNames)('should accept valid full name: %s', (fullName) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidFullNames)('should reject invalid full name: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: value });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = [0, 1];
    const invalidStatuses = [
      { value: 2, error: '必须是以下值之一' },
      { value: -1, error: '必须是以下值之一' },
      { value: 'invalid', error: '必须是数字' },
    ];

    test.each(validStatuses)('should accept valid status: %s', (status) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', status });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidStatuses)('should reject invalid status: $value', ({ value, error }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', status: value });
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain(error);
    });
  });

  describe('User Update Validation', () => {
    test('should accept partial update with valid fields', () => {
      const result = schemas.userUpdate.validate({ fullName: 'New Name' });
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid fields in update', () => {
      const result = schemas.userUpdate.validate({ username: 'invalid@user' });
      expect(result.error).toBeDefined();
    });
  });

  describe('Register Validation', () => {
    test('should accept complete valid registration', () => {
      const result = schemas.register.validate({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234',
        fullName: 'Test User',
      });
      expect(result.error).toBeUndefined();
    });

    test('should reject registration without required fields', () => {
      const result = schemas.register.validate({
        username: 'testuser',
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('Login Validation', () => {
    test('should accept valid login', () => {
      const result = schemas.login.validate({
        username: 'testuser',
        password: 'Test1234',
      });
      expect(result.error).toBeUndefined();
    });

    test('should reject login without required fields', () => {
      const result = schemas.login.validate({
        username: 'testuser',
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Messages Consistency', () => {
    test('should provide Chinese error messages', () => {
      const result = schemas.userCreate.validate({});
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).not.toContain('is required');
    });
  });
});
