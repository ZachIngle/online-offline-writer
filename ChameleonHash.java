import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.math.BigInteger;
import java.security.interfaces.DSAPublicKey;

public class ChameleonHash {
	public static BigInteger[] setup(Integer bitLength) throws Exception {
		KeyPairGenerator keyGen = KeyPairGenerator.getInstance("DSA", "SUN");
        SecureRandom random = SecureRandom.getInstance("SHA1PRNG", "SUN");
        keyGen.initialize(bitLength, random);
        KeyPair pair = keyGen.generateKeyPair();
        PublicKey pub = pair.getPublic();
        DSAPublicKey dsaPublicKey = (DSAPublicKey) pub;

        BigInteger[] pp = new BigInteger[4];	// g, p, q, bitLength
        pp[0] = dsaPublicKey.getParams().getG();
        pp[1] = dsaPublicKey.getParams().getP();
        pp[2] = dsaPublicKey.getParams().getQ();
        pp[3] = new BigInteger(Integer.toString(bitLength));

        return pp;
	}

	public static BigInteger[] keyGen(BigInteger g, BigInteger p, BigInteger q, int bitLength) throws Exception {
		BigInteger[] key = new BigInteger[2];	// sk, pk
		SecureRandom sr = SecureRandom.getInstance("SHA1PRNG", "SUN");
        BigInteger sk = new BigInteger(bitLength, sr).mod(q);
        BigInteger pk = g.modPow(sk, p);

        key[0] = sk;
        key[1] = pk;

        return key;
	}

	public static BigInteger[] hash(BigInteger m, BigInteger pk, BigInteger[] pp) throws Exception {
		BigInteger[] chValues = new BigInteger[3];	// message, rand and hashValue
		BigInteger g = pp[0];
		BigInteger p = pp[1];
		int bitLength = pp[3].intValue();
		BigInteger r = new BigInteger(bitLength, SecureRandom.getInstance("SHA1PRNG", "SUN"));
		BigInteger v = g.modPow(m,p).multiply(pk.modPow(r,p)).mod(p);
		chValues[0] = m;
		chValues[1] = r;
		chValues[2] = v;

		return chValues;
	}

	public static boolean verify(BigInteger pk, BigInteger[] chValues, BigInteger[] pp) {
		BigInteger m = chValues[0];
		BigInteger r = chValues[1];
		BigInteger v = chValues[2];
		BigInteger g = pp[0];
		BigInteger p = pp[1];

		BigInteger vPrime = g.modPow(m,p).multiply(pk.modPow(r,p)).mod(p);

		if (vPrime.equals(v))
			return true;
		return false;
	}

	public static void adapt(BigInteger mPrime, BigInteger sk, BigInteger[] chValues, BigInteger[] pp) {
		BigInteger g = pp[0];
		BigInteger p = pp[1];
		BigInteger q = pp[2];
		BigInteger m = chValues[0];
		BigInteger r = chValues[1];
		BigInteger rPrime = m.add(sk.multiply(r)).add(mPrime.negate()).multiply(sk.modInverse(q)).mod(q);
		chValues[0] = mPrime;
		chValues[1] = rPrime;
	}
}