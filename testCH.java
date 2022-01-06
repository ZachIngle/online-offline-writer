import java.math.BigInteger;

public class testCH {
	public static void main(String[] args) {
		try {
		BigInteger[] pp = ChameleonHash.setup(2048);
		BigInteger[] key = ChameleonHash.keyGen(pp[0], pp[1], pp[2], 2048);
 		
 		BigInteger m = new BigInteger("1234567890123456789");
 		BigInteger sk = key[0];
 		BigInteger pk = key[1];
 		BigInteger[] ch = ChameleonHash.hash(m, pk, pp);

 		System.out.println("m = " + ch[0].toString());
 		System.out.println("r = " + ch[1].toString());
 		System.out.println("v = " + ch[2].toString());
 		if (ChameleonHash.verify(pk, ch, pp))
 			System.out.println("Chameloen hash is valid.");
 		else
 			System.out.println("Chameloen hash is invalid.");

 		BigInteger mPrime = new BigInteger("9876543210987654321");
 		ChameleonHash.adapt(mPrime, sk, ch, pp);

 		System.out.println("mPrime = " + ch[0].toString());
 		System.out.println("rPrime = " + ch[1].toString());
 		System.out.println("v = " + ch[2].toString());
 		if (ChameleonHash.verify(pk, ch, pp))
 			System.out.println("Chameloen hash is valid.");
 		else
 			System.out.println("Chameloen hash is invalid.");
		}
		catch (Exception e) {
			System.out.println(e);
		}
	}
}