import { useEffect, useState } from "react";
import "./App.css";

// polkadot js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { SubmittableResultValue } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";

interface Data {
  blockNumber: string;
  hash: string;
  chainName: string;
  headers: string;
}

async function setAccountBalance(
  api: ApiPromise,
  account: KeyringPair,
  balance: number
) {
  console.log(account);
  console.log(account.address);
  console.log(api);
  console.log(api.query);
  console.log(api.query.sudo);
  const sudoKey = await api.query.sudo.key();
  console.log(sudoKey.toString());
  const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
  // add the alice account to the keyring so that we can sign the transaction
  keyring.addFromUri("//Alice");
  const sudoPair = keyring.getPair(sudoKey.toString());
  const unsub = await api.tx.sudo
    .sudo(api.tx.balances.setBalanceDeprecated(account.address, balance, 1))
    .signAndSend(sudoPair, async ({ status }) => {
      if (status.isInBlock) {
        const blockHash = await api.rpc.chain.getBlockHash(status.asInBlock);
        console.log(`Completed at block hash #${blockHash}`);
        unsub();
      } else {
        console.log(`Current status: ${status.type}`);
      }
    });
}

// takes in the name of the account and returns the account object
async function getAccount(name: string) {
  const keyring = new Keyring({ type: "sr25519" });
  try {
    const account = keyring.addFromUri("//" + name);
    return account;
  } catch (error) {
    console.error("Error adding account:", error);
  }
}

async function getBalance(accountName: string) {
  // const wsProvider = new WsProvider("wss://rpc.polkadot.io");
  const wsProvider = new WsProvider("ws://localhost:9944");
  const api = await ApiPromise.create({ provider: wsProvider });
  // get the account object
  const account = await getAccount(accountName);

  if (!account) {
    throw new Error("Account not found");
  }

  const {
    data: { free },
  } = (await api.query.system.account(account.address)) as any;

  return free.toHuman();
}

// takes in the recipient, sender, and amount
async function transfer(api: ApiPromise, to: any, from: any, amount: number) {
  const unsub = await api.tx.balances
    .transfer(to.address, amount)
    .signAndSend(from, ({ status }: SubmittableResultValue) => {
      if (status.isInBlock) {
        console.log(
          `Successful transfer of ${amount} with hash`,
          status.asInBlock.toHex()
        );
      } else {
        console.log("Status of transfer: ", status.type);
      }
    });

  unsub();
}

function App() {
  const [AliceBalance, setAliceBalance] = useState<string>("");
  const [BobBalance, setBobBalance] = useState<string>("");
  const [headerSub, setHeaderSub] = useState<string>("");
  const [data, setData] = useState<Data>({
    blockNumber: "",
    hash: "",
    chainName: "",
    headers: "",
  });

  //! this is so dangerous lmao
  const [api, setApi] = useState<ApiPromise>({} as unknown as ApiPromise);

  // Do something after the component is rendered, but only once
  useEffect(() => {
    const connectToApi = async () => {
      try {
        const wsProvider = new WsProvider("ws://localhost:9944");
        const api = await ApiPromise.create({ provider: wsProvider });
        setApi(api);

        const unsubHeaders = await api.rpc.chain.subscribeNewHeads((header) => {
          // Set the headerSub to the latest header
          setHeaderSub(header.number.toHuman() as string);

          if (headerSub.length > 10) {
            // Unsubscribe from the new headers
            unsubHeaders();
          }
        });

        setData({
          blockNumber: api.genesisHash.toHex(),
          // hash: api.consts.babe.epochDuration.toHuman() as string,
          hash: "123",
          chainName: (await api.rpc.system.chain()).toString(),
          headers: headerSub,
        });
      } catch (error) {
        console.error("Error connecting to the node:", error);
      }
    };

    connectToApi();

    // get the balance of Alice
    getBalance("Alice").then((balance) => {
      setAliceBalance(balance);
    });

    // get the balance of Bob
    getBalance("Bob").then((balance) => {
      setBobBalance(balance);
    });
  }, []);

  // handle transfer function that takes in the two input fields and the amount
  const handleTransfer = () => {
    const recipientText = document.getElementById(
      "recipient"
    ) as HTMLInputElement;
    const senderText = document.getElementById("sender") as HTMLInputElement;

    const amount = document.querySelector(
      "input[type=number]"
    ) as HTMLInputElement;

    getAccount(recipientText.value).then((recipientAccount) => {
      getAccount(senderText.value).then((senderAccount) => {
        if (recipientAccount && senderAccount) {
          transfer(api, recipientAccount, senderAccount, Number(amount.value));
        }
      });
    });
  };

  // console.log(data);
  // console.log(headerSub);

  function setBalanceHandler() {
    const recipientText = document.getElementById(
      "account"
    ) as HTMLInputElement;

    const amount = document.querySelector(
      "input[type=number]"
    ) as HTMLInputElement;

    getAccount(recipientText.value).then((recipientAccount) => {
      console.log(recipientAccount);
      if (recipientAccount) {
        setAccountBalance(api, recipientAccount, Number(amount.value));
      } else {
        console.log("Account not found");
      }
    });
  }

  return (
    <>
      <div>
        <header className="font-black text-3xl">Polkadot.JS</header>
        <main className="mt-12 mb-12">
          <table>
            <thead>
              <tr>
                {/* dynamically display headers based on the type Data */}
                {Object.keys(data).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {
                  // If data is not empty, then display the data
                  data && (
                    <>
                      <td>{data.hash}</td>
                      <td>{data.blockNumber}</td>
                      <td>{data.chainName}</td>
                      <td>{data.headers}</td>
                    </>
                  )
                }
                {
                  // If data is empty, then display loading
                  !data && (
                    // Else, display loading
                    <td>Loading...</td>
                  )
                }
              </tr>
            </tbody>
          </table>
        </main>
        <hr />
        <main className="mt-12 mb-12">
          {/* Two Labels side by side to display the balance of Alice on the left and Bob on the right */}
          <div>
            <label className="mr-12">Alice balance: {AliceBalance}</label>
            <label>Bob Balance: {BobBalance}</label>
          </div>
        </main>
        <hr />
        <main className="mt-12 mb-12">
          {/* two input fields, consisting of recipient and sender names, and an amount */}
          <input id="recipient" type="text" placeholder="Recipient" />
          <input id="sender" type="text" placeholder="Sender" />
          <input type="number" placeholder="Amount" />
          <button
            onClick={() => {
              getAccount("Alice").then((account) => {
                console.log(account);
              });
            }}
          >
            Get Account
          </button>
          <button
            onClick={() => {
              handleTransfer();
            }}
          >
            Transfer
          </button>
        </main>
        <hr />
        <main className="mt-12">
          {/* button for the setaccountbalance and corresponding input fields */}
          <input
            id="account"
            type="text"
            placeholder="Account"
            value={"Alice"}
          />
          <input
            id="balance"
            type="number"
            placeholder="Balance"
            value={1231231}
          />
          <button
            onClick={() => {
              setBalanceHandler();
            }}
          >
            Set Balance
          </button>
        </main>
      </div>
    </>
  );
}

export default App;
