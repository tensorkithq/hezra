import { type ToolMetadata } from "xmcp";
// import { useState } from "react";

export const metadata: ToolMetadata = {
  name: "incrementer",
  description: "incrementer React",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading incrementer",
        invoked: "incrementer loaded",
      },
      widgetAccessible: true,
      widgetPrefersBorder: true,
      widgetState:{
        count: 10
      }
    },
  },
};

export default function handler() {
  
  const count = 10;

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button>Increment</button>
      <button>Decrement</button>
      <button>Reset</button>
    </div>
  );
}
