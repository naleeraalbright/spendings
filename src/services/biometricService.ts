// Biometric Security Service using WebAuthn API (Windows Hello, Face ID, Touch ID, Android Biometrics)

export class BiometricService {
  /**
   * Check if hardware biometric platform authenticator is supported by browser/device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return false;
    } catch (e) {
      console.warn('Biometrics check error:', e);
      return false;
    }
  }

  /**
   * Register a new biometric credential for the user
   */
  static async registerBiometrics(username: string): Promise<string> {
    if (!window.PublicKeyCredential) {
      throw new Error('Biometric authentication is not supported on this device/browser.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'SpendWise Security',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in biometrics (TouchID, FaceID, Windows Hello)
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Biometric setup was cancelled or failed.');
    }

    return credential.id;
  }

  /**
   * Verify identity using registered biometric credential
   */
  static async verifyBiometrics(credentialId?: string): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      throw new Error('Biometrics not available.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = credentialId ? [
      {
        id: Uint8Array.from(atob(credentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        type: 'public-key',
        transports: ['internal']
      }
    ] : [];

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'required',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    return !!assertion;
  }

  /**
   * Hash a PIN code using standard SHA-256 for global PIN security across Web and Mobile
   */
  static async hashPin(pin: string): Promise<string> {
    const cleanPin = pin.trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanPin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify a PIN code against stored hash with legacy support
   */
  static async verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
    const standardHash = await this.hashPin(enteredPin);
    if (standardHash === storedHash) return true;

    // Fallback: Check legacy salted hash
    const encoder = new TextEncoder();
    const data = encoder.encode(`spendings_salt_${enteredPin.trim()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === storedHash;
  }
}
