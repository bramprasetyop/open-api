import * as crypto from 'crypto';

export const CryptService = {
  encrypt: (text: string) => {
    if (text == null) {
      return null;
    }

    try {
      // random initialization vector
      const iv = crypto.randomBytes(16);

      // random salt
      const salt = crypto.randomBytes(64);

      // derive key: 32 byte key length - in assumption the masterkey is a cryptographic and NOT a password there is no need for
      // a large number of iterations. It may can replaced by HKDF
      const key = crypto.pbkdf2Sync(
        process.env.MASTER_KEY,
        salt,
        2145,
        32,
        'sha512'
      );

      // AES 256 GCM Mode
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);

      // encrypt the given text
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
      ]);

      // extract the auth tag
      // generate output
      return Buffer.concat([salt, iv, encrypted]).toString('base64');
    } catch (e) {
      console.log('Failed to encrypt', text, e);
    }

    // error
    return null;
  },

  /**
   * Decrypts text by given key
   * @param String base64 encoded input data
   * @param Buffer masterkey
   * @returns String decrypted (original) text
   */
  decrypt: encryptedData => {
    if (encryptedData == null) {
      return null;
    }

    const base64Matcher = new RegExp(
      '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$'
    );

    if (!base64Matcher.test(encryptedData)) {
      console.log('Invalid hash');
      return null;
    }

    try {
      // base64 decoding
      const data = Buffer.from(encryptedData, 'base64');

      // convert data to buffers
      const salt = data.subarray(0, 64);
      const iv = data.subarray(64, 80);

      const encryptedText = data.subarray(80);

      // derive key using; 32 byte key length
      const key = crypto.pbkdf2Sync(
        process.env.MASTER_KEY,
        salt,
        2145,
        32,
        'sha512'
      );

      // AES 256 GCM Mode
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(key),
        iv
      );

      // encrypt the given text
      const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final()
      ]);

      return decrypted.toString();
    } catch (e) {
      console.log('Catch: ', e);
    }
    // error
    return null;
  }
};
