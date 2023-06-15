import { useEffect, useState } from "react";
import "./App.css";

// polkadot js
import { ApiPromise, WsProvider } from "@polkadot/api";

interface Data {
  blockNumber: string;
  hash: string;
  chainName: string;
}

function App() {
  const [data, setData] = useState<Data>({
    blockNumber: "",
    hash: "",
    chainName: "",
  });

  // Construct
  const wsProvider = new WsProvider("wss://rpc.polkadot.io");
  const api = ApiPromise.create({ provider: wsProvider });

  // Do something after the component is rendered, but only once
  useEffect(() => {
    api
      .then(async (api) => {
        setData({
          blockNumber: api.genesisHash.toHex(),
          hash: api.consts.babe.epochDuration.toHuman() as string,
          chainName: (await api.rpc.system.chain()).toString(),
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  console.log(data);

  return (
    <>
      <div>
        <header className="font-black text-3xl">Polkadot.JS</header>
        {/* Give me a table consisting of the data fetched from the Polkadot Nodes */}
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
      </div>
    </>
  );
}

export default App;
