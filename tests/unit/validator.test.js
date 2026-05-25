const { schemas, validate } = require('../../src/middleware/validator');

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
      { value: '' },
      { value: 'ab' },
      { value: 'a'.repeat(51) },
      { value: '123test' },
      { value: 'test@user' },
      { value: 'test user' },
      { value: 'test!user' },
    ];

    test.each(validUsernames)('should accept valid username: %s', (username) => {
      const result = schemas.userCreate.validate({ username, password: 'Test1234', fullName: 'Test User' });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidUsernames)('should reject invalid username: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: value, password: 'Test1234', fullName: 'Test User' });
      expect(result.error).toBeDefined();
    });
  });

  describe('Password Validation', () => {
    const validPasswords = [
      'Test1234',
      'test1234',
      'TEST1234',
      'Test1234!@#',
      'aA1'.padEnd(8, 'a'),
      'Aa1'.padEnd(100, 'a'),
    ];

    const invalidPasswords = [
      { value: '' },
      { value: 'short1' },
      { value: 'a'.repeat(101) },
      { value: 'onlyletters' },
      { value: '12345678' },
    ];

    test.each(validPasswords)('should accept valid password: %s', (password) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password, fullName: 'Test User' });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidPasswords)('should reject invalid password: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: value, fullName: 'Test User' });
      expect(result.error).toBeDefined();
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
      { value: 'invalid-email' },
      { value: 'test@' },
      { value: '@example.com' },
    ];

    test.each(validEmails)('should accept valid email: %s', (email) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', email });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidEmails)('should reject invalid email: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', email: value });
      expect(result.error).toBeDefined();
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
      { value: '12345678' },
      { value: '123456789012345678901' },
      { value: 'invalid-phone' },
    ];

    test.each(validPhones)('should accept valid phone: %s', (phone) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', phone });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidPhones)('should reject invalid phone: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', phone: value });
      expect(result.error).toBeDefined();
    });
  });

  describe('Full Name Validation', () => {
    const validFullNames = [
      'Test User',
      '张三',
      'a'.repeat(100),
    ];

    const invalidFullNames = [
      { value: '' },
      { value: 'a'.repeat(101) },
    ];

    test.each(validFullNames)('should accept valid full name: %s', (fullName) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidFullNames)('should reject invalid full name: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: value });
      expect(result.error).toBeDefined();
    });
  });

  describe('Status Validation', () => {
    const validStatuses = [0, 1];
    const invalidStatuses = [
      { value: 2 },
      { value: -1 },
      { value: 'invalid' },
    ];

    test.each(validStatuses)('should accept valid status: %s', (status) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', status });
      expect(result.error).toBeUndefined();
    });

    test.each(invalidStatuses)('should reject invalid status: $value', ({ value }) => {
      const result = schemas.userCreate.validate({ username: 'testuser', password: 'Test1234', fullName: 'Test User', status: value });
      expect(result.error).toBeDefined();
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

  describe('Error Message Translation', () => {
    // 测试验证中间件的错误翻译功能
    test('should translate validation errors to Chinese via middleware', () => {
      const middleware = validate(schemas.userCreate);
      const req = {
        body: {
          username: '123invalid',
          password: 'short',
          email: 'invalid-email',
          phone: '123',
        }
      };
      
      let caughtError;
      
      middleware(req, null, (err) => {
        caughtError = err;
      });
      
      expect(caughtError).toBeDefined();
      expect(caughtError.errors).toBeDefined();
      
      // 检查是否有中文错误消息
      const hasChineseError = caughtError.errors.some(e => 
        /[\u4e00-\u9fa5]/.test(e.message)
      );
      expect(hasChineseError).toBe(true);
    });
  });
});
