import { cn } from "@/lib/utils";

interface ConversationMessageProps {
  role: "user" | "assistant";
  content: string;
}

const ConversationMessage = ({ role, content }: ConversationMessageProps) => {
  return (
    <div className={cn(
      "flex w-full mb-2 opacity-80 animate-in fade-in slide-in-from-bottom-2 duration-500",
      role === "user" ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%]  px-3 py-1.5",
        role === "user" ? "ml-auto opacity-60" : ""
      )}>
        <p className="text-xs font-sans leading-relaxed text-black/80">{content}</p>
      </div>
    </div>
  );
};

export default ConversationMessage;
