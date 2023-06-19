import { ApiPromise } from "@polkadot/api";
import { getBalance } from "./utils.ts";
import { useEffect, useState } from "react";

interface BalanceViewProps {
  api: ApiPromise;
}

const BalanceView = ({ api }: BalanceViewProps) => {
  const [aliceBalance, setAliceBalance] = useState("");
  const [bobBalance, setBobBalance] = useState("");

  // keep the balance state updated, every second
  useEffect(() => {
    // get the balance of Alice
    const aliceBalanceDiv = document.getElementById("alice-balance");
    getBalance(api, "Alice").then((balance) => {
      if (balance > aliceBalance) {
        // add the classname "text-green-500" to the div
        aliceBalanceDiv?.classList.add("text-green-500");
        setTimeout(() => {
          aliceBalanceDiv?.classList.remove("text-green-500");
        }, 1000);
      } else if (balance < aliceBalance) {
        // add the classname "text-red-500" to the div
        aliceBalanceDiv?.classList.add("text-red-500");
        setTimeout(() => {
          aliceBalanceDiv?.classList.remove("text-red-500");
        }, 1000);
      }

      setAliceBalance(balance);
    });

    // get the balance of Bob
    getBalance(api, "Bob").then((balance) => {
      if (balance > bobBalance) {
        // add the classname "text-green-500" to the div
        const bobBalanceDiv = document.getElementById("bob-balance");
        bobBalanceDiv?.classList.add("text-green-500");
        setTimeout(() => {
          bobBalanceDiv?.classList.remove("text-green-500");
        }, 1000);
      }

      setBobBalance(balance);
    });
  });

  return (
    <div className="flex justify-center">
      {/* Two Labels side by side to display the balance of Alice on the left and Bob on the right */}
      <div className="flex flex-row gap-10">
        <label className="font-bold flex flex-col text-left">
          <div>Alice Balance:</div>
          <div className="font-mono transition-all" id="alice-balance">
            {aliceBalance}
          </div>
        </label>
        <label className="font-bold flex flex-col text-left">
          <div>Bob Balance:</div>
          <div className="font-mono transition-all" id="bob-balance">
            {bobBalance}
          </div>
        </label>
      </div>
    </div>
  );
};

export default BalanceView;
