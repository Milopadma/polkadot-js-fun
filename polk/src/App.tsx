import { useEffect, useState } from "react";
import "./App.css";

// polkadot js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";

interface Data {
  blockNumber: string;
  hash: string;
  chainName: string;
  headers: string;
}

async function getAccount(name: string) {
  const keyring = new Keyring({ type: "sr25519" });
  try {
    const account = keyring.addFromUri("//" + name);
    return account;
  } catch (error) {
    console.error("Error adding account:", error);
  }
}

async function transfer(to: any, from: any, amount: number) {
  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.polkadot.io"),

    types: {
      Address: "AccountId",
      LookupSource: "AccountId",
      AccountInfo: "AccountInfoWithTripleRefCount",
    },
  });

  const unsub = await api.tx.balances
    .transfer(to.address, amount)
    .signAndSend(from, ({ status }: any) => {
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
  const [headerSub, setHeaderSub] = useState<string>("");
  const [data, setData] = useState<Data>({
    blockNumber: "",
    hash: "",
    chainName: "",
    headers: "",
  });

  // Construct
  const wsProvider = new WsProvider("wss://rpc.polkadot.io");
  const api = ApiPromise.create({ provider: wsProvider });

  // handle transfer function that takes in the two input fields and the amount
  const handleTransfer = () => {
    const recipient = document.getElementById("recipient") as HTMLInputElement;
    const sender = document.getElementById("sender") as HTMLInputElement;

    const amount = document.querySelector(
      "input[type=number]"
    ) as HTMLInputElement;

    getAccount(recipient.value).then((recipientAccount) => {
      getAccount(sender.value).then((senderAccount) => {
        transfer(recipientAccount, senderAccount, Number(amount.value));
      });
    });
  };

  // Do something after the component is rendered, but only once
  useEffect(() => {
    api
      .then(async (api) => {
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
          hash: api.consts.babe.epochDuration.toHuman() as string,
          chainName: (await api.rpc.system.chain()).toString(),
          headers: headerSub,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }, [api, headerSub]);

  console.log(data);
  console.log(headerSub);

  return (
    <>
      <div>
        <header className="font-black text-3xl">Polkadot.JS</header>
        <main>
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
        <main>
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
      </div>
    </>
  );
}

export default App;
