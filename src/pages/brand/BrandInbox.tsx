import { useState } from "react";
import { BrandLayout } from "@/components/brand/BrandLayout";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { useBrandMessages, Conversation } from "@/hooks/useBrandMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, ArrowLeft, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function BrandInbox() {
  const { user } = useAuth();
  const { conversations, unreadCount, loading, sendMessage, markAsRead, getConversationMessages, refresh } = useBrandMessages();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === "unread") return conv.unreadCount > 0;
    return true;
  });

  const conversationMessages = selectedConversation 
    ? getConversationMessages(selectedConversation.partnerId)
    : [];

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark unread messages as read
    const messages = getConversationMessages(conv.partnerId);
    for (const msg of messages) {
      if (!msg.is_read && msg.recipient_user_id === user?.id) {
        await markAsRead(msg.id);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    setSending(true);
    const success = await sendMessage(selectedConversation.partnerId, replyText.trim(), {
      artistId: selectedConversation.artistId,
    });

    if (success) {
      setReplyText("");
      toast.success("Message sent");
    } else {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="flex w-full">
        <BrandSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                Messages
              </h1>
              <p className="text-muted-foreground">
                Communicate with artists
              </p>
            </div>

            {selectedConversation ? (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.partnerAvatar || undefined} />
                      <AvatarFallback>
                        {selectedConversation.partnerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.partnerName}</h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {conversationMessages.map((msg) => {
                      const isOwn = msg.sender_user_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.subject && (
                              <p className={`text-xs font-semibold mb-1 ${isOwn ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {msg.subject}
                              </p>
                            )}
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All Messages</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {filteredConversations.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {activeTab === "unread" ? "No unread messages" : "No messages yet"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Messages from artists will appear here
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((conv) => (
                        <Card
                          key={conv.partnerId}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSelectConversation(conv)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={conv.partnerAvatar || undefined} />
                                <AvatarFallback>
                                  {conv.partnerName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">
                                    {conv.partnerName}
                                  </h3>
                                  {conv.unreadCount > 0 && (
                                    <Badge variant="default" className="text-xs">
                                      {conv.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conv.lastMessage}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </BrandLayout>
  );
}
