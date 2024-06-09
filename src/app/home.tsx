"use client";

import SignInWithZupass from "@/components/SignInWithZupass";
import { config } from "@/config/zuauth";
import {
  constructZupassPcdAddRequestUrl,
  zupassPopupExecute
} from "@pcd/passport-interface";
import { zuAuthPopup } from "@pcd/zuauth/client";
import { useCallback, useEffect, useReducer, useState } from "react";
import ReactQRImage from "react-qr-image";

type AuthState =
  | "logged out"
  | "auth-start"
  | "authenticating"
  | "authenticated"
  | "error";

export default function Home() {
  const [pcdStr, setPcdStr] = useState<string>("");
  const [authState, setAuthState] = useState<AuthState>("logged out");
  const [log, addLog] = useReducer((currentLog: string, toAdd: string) => {
    return `${currentLog}${currentLog === "" ? "" : "\n"}${toAdd}`;
  }, "");
  const [user, setUser] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    (async () => {
      if (authState === "auth-start") {
        addLog("Fetching watermark");
        const watermark = (await (await fetch("/api/watermark")).json())
          .watermark;
        addLog("Got watermark");
        addLog("Opening popup window");
        setAuthState("authenticating");
        const result = await zuAuthPopup({
          zupassUrl: process.env.NEXT_PUBLIC_ZUPASS_SERVER_URL as string,
          fieldsToReveal: {
            revealAttendeeEmail: true,
            revealAttendeeName: true
          },
          watermark,
          config: config
        });

        if (result.type === "pcd") {
          addLog("Received PCD");
          setPcdStr(result.pcdStr);

          const loginResult = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pcd: result.pcdStr })
          });

          setUser((await loginResult.json()).user);
          addLog("Authenticated successfully");
          setAuthState("authenticated");
        } else if (result.type === "popupBlocked") {
          addLog("The popup was blocked by your browser");
          setAuthState("error");
        } else if (result.type === "popupClosed") {
          addLog("The popup was closed before a result was received");
          setAuthState("error");
        } else {
          addLog(`Unexpected result type from zuAuth: ${result.type}`);
          setAuthState("error");
        }
      }
    })();
  }, [addLog, authState]);

  const auth = useCallback(() => {
    if (authState === "logged out" || authState === "error") {
      addLog("Beginning authentication");
      setAuthState("auth-start");
    }
  }, [addLog, authState]);

  const logout = useCallback(() => {
    setUser(undefined);
    setPcdStr("");
    setAuthState("logged out");
    addLog("Logged out");
  }, []);

  const [friend, setFriend] = useState("");
  const [promise, setPromise] = useState("");
  const [shareableUrl, setShareableUrl] = useState<string | undefined>(
    undefined
  );

  const pinkiePromise = useCallback(() => {
    (async () => {
      setPromiseState("promising");
      const promiseResult = await fetch("/api/promise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend, promise, name: user?.attendeeName })
      });

      const { made, received } = await promiseResult.json();

      const madeUrl = constructZupassPcdAddRequestUrl(
        process.env.NEXT_PUBLIC_ZUPASS_SERVER_URL ?? "https://zupass.org",
        window.location.toString(),
        made,
        "Promises Made",
        true
      );

      const receivedUrl = constructZupassPcdAddRequestUrl(
        process.env.NEXT_PUBLIC_ZUPASS_SERVER_URL ?? "https://zupass.org",
        window.location.toString(),
        received,
        "Promises Received",
        true
      );

      const result = await zupassPopupExecute(madeUrl);

      setShareableUrl(receivedUrl);
    })();
  }, [friend, promise, user?.attendeeName]);

  const [promiseState, setPromiseState] = useState<"idle" | "promising">(
    "idle"
  );

  return (
    <div className="container mx-auto p-4 xl:py-8 max-w-xl">
      <main className=" rounded-lg border-pink-600 border-solid border bg-pink-800 p-6">
        <h1 className="text-3xl font-bold ">
          🤙{" "}
          <span className="underline decoration-pink-600">
            Esmeralda Pinkie Promises
          </span>
        </h1>
        <div className="flex flex-col gap-8 my-8">
          {authState !== "authenticated" && (
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                To make a promise, sign in with Zupass:
              </label>
              <div className="mx-auto mt-2">
                <SignInWithZupass
                  loading={
                    authState === "auth-start" || authState === "authenticating"
                  }
                  onClick={auth}
                />
              </div>
            </div>
          )}
          {user && (
            <div>
              Authenticated as <strong>{user.attendeeName}</strong> (
              <strong>{user.attendeeEmail}</strong>)
            </div>
          )}
          {authState === "authenticated" && !shareableUrl && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-medium">
                  Who do you want to make a promise to?
                </label>
                <input
                  value={friend}
                  onChange={(ev) => setFriend(ev.target.value)}
                  className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-gray-900 placeholder-slate-400"
                  type="text"
                  placeholder="A friend, colleague, or acquaintance"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium">What is your promise?</label>
                <textarea
                  value={promise}
                  onChange={(ev) => setPromise(ev.target.value)}
                  className="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-gray-900 placeholder-slate-400"
                  placeholder="I promise to..."
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="mx-auto">
                  <button
                    onClick={pinkiePromise}
                    className="border-2 border-yellow-100/30 border-solid focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-pink-50 text-white font-semibold h-12 px-6 py-2 rounded-lg w-full flex items-center justify-center sm:w-auto bg-pink-600 dark:highlight-white/20 hover:bg-pink-600/75 text-lg"
                  >
                    {promiseState === "promising" && (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {promiseState !== "promising" && (
                      <span className="inline-block w-6 -ml-1 mr-3 h-6 text-lg">
                        🤙
                      </span>
                    )}{" "}
                    Pinkie Promise
                  </button>
                </div>
              </div>
            </>
          )}
          {shareableUrl && (
            <div>
              Share this QR code with <strong>{friend}</strong>, or click{" "}
              <span
                onClick={() => {
                  window.navigator.clipboard.writeText(shareableUrl);
                }}
                className="font-bold cursor-pointer"
              >
                here
              </span>{" "}
              to copy to clipboard:
              <div className="my-2">
                <ReactQRImage
                  background="white"
                  color="black"
                  transparent={false}
                >
                  {shareableUrl}
                </ReactQRImage>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
