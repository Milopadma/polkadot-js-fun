import { ApiPromise } from "@polkadot/api";
import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";

export type AccountKeyring = {
  account: KeyringPair;
  keyring: Keyring;
};

export async function getBalance(
  api: ApiPromise,
  accountName: string
): Promise<string> {
  // get the account object
  const { account } = await getAccount(accountName);

  if (!account) {
    throw new Error("Account not found");
  }

  const {
    data: { free },
  } = (await api.query.system.account(account.address)) as any;

  return free.toHuman();
}

// takes in the name of the account and returns the account object
export async function getAccount(name: string): Promise<AccountKeyring> {
  const keyring = new Keyring({ type: "sr25519" });
  try {
    const account = keyring.addFromUri("//" + name);
    return { account, keyring };
  } catch (error) {
    console.error("Error adding account:", error);
  }
  return { account: {} as KeyringPair, keyring: {} as Keyring };
}
