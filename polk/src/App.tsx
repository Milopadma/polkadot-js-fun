import { useEffect, useState } from "react";
import "./App.css";

// polkadot js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { SubmittableResultValue } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import BalanceView from "./BalanceView.tsx";
import { getBalance, getAccount } from "./utils";

interface Data {
  blockNumber: string;
  hash: string;
  chainName: string;
  headers: string;
}

async function setAccountBalance(
  api: ApiPromise,
  account: KeyringPair,
  amount: number
): Promise<boolean> {
  console.log(account);
  console.log(account.address);
  console.log(api);
  console.log(api.query);
  console.log(api.query.sudo);
  const sudoKey = await api.query.sudo.key();
  console.log(amount);
  console.log(sudoKey.toString());
  const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });
  // add the alice account to the keyring so that we can sign the transaction
  keyring.addFromUri("//Alice");
  const sudoPair = keyring.getPair(sudoKey.toString());
  const unsub = await api.tx.sudo
    .sudo(api.tx.balances.setBalanceDeprecated(account.address, amount, 0))
    .signAndSend(sudoPair, async ({ status }) => {
      if (status.isInBlock) {
        const blockHash = await api.rpc.chain.getBlockHash(status.asInBlock);
        console.log(`Completed at block hash #${blockHash}`);
        // get the balance of Alice
        getBalance(api, "Alice").then((balance) => {
          console.log(balance);
        });
        unsub();
      } else {
        console.log(`Current status: ${status.type}`);
      }
    });

  return true;
}

// takes in the recipient, sender, and amount
async function transfer(api: ApiPromise, to: any, from: any, amount: number) {
  const unsub = await api.tx.balances
    .transfer(to.address, BigInt(amount))
    .signAndSend(from, ({ status }: SubmittableResultValue) => {
      if (status.isInBlock) {
        console.log(
          `Successful transfer of ${amount} with hash`,
          status.asInBlock.toHex()
        );
        unsub();
      } else {
        console.log("Status of transfer: ", status.type);
      }
    });
}

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

    getAccount(recipientText.value).then(
      ({ account: recipientAccount, keyring: recipientKeyring }) => {
        getAccount(senderText.value).then(
          ({ account: senderAccount, keyring: senderKeyring }) => {
            if (recipientAccount && senderAccount) {
              transfer(
                api,
                recipientAccount,
                senderAccount,
                Number(amount.value)
              );
            }
          }
        );
      }
    );
  };

  // console.log(data);
  // console.log(headerSub);

  function setBalanceHandler() {
    const recipientText = document.getElementById(
      "account"
    ) as HTMLInputElement;

    const amount = document.getElementById("balance") as HTMLInputElement;

    setIsLoading(true);

    // get the account object from the name and call the setAccountBalance function
    getAccount(recipientText.value).then(async ({ account }) => {
      if (account) {
        const response = await setAccountBalance(
          api,
          account,
          Number(amount.value)
        );
        if (response !== undefined) {
          setIsLoading(false);
        }
      } else {
        console.error("Account not found");
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
          <BalanceView api={api}></BalanceView>
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
            contentEditable={true}
            placeholder="Account"
            value={"Alice"}
          />
          <input
            id="balance"
            type="number"
            contentEditable={true}
            placeholder="Balance"
            // value={1231231}
          />
          <button
            onClick={() => {
              setBalanceHandler();
            }}
          >
            {isLoading ? "Loading..." : "Set Balance"}
          </button>
        </main>
      </div>
    </>
  );
}

export default App;
