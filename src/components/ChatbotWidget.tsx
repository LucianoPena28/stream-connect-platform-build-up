import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Tv, Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SERVICE_CARDS = [
  { name: 'Netflix Profile', price: '$10 BZD/mo', icon: Tv, color: 'bg-netflix text-netflix-foreground', link: '/services' },
  { name: 'Netflix All 4 Profiles', price: '$30 BZD/mo', icon: Tv, color: 'bg-netflix text-netflix-foreground', link: '/services' },
  { name: 'Spotify Individual', price: '$20 BZD/mo', icon: Music, color: 'bg-spotify text-spotify-foreground', link: '/services' },
  { name: 'Spotify Family', price: '$30 BZD/mo', icon: Music, color: 'bg-spotify text-spotify-foreground', link: '/services' },
];

function detectServiceCards(content: string): typeof SERVICE_CARDS {
  const lower = content.toLowerCase();
  const matched: typeof SERVICE_CARDS = [];
  if (lower.includes('netflix profile') && !lower.includes('all 4')) matched.push(SERVICE_CARDS[0]);
  if (lower.includes('all 4 profiles') || lower.includes('netflix all')) matched.push(SERVICE_CARDS[1]);
  if (lower.includes('spotify individual')) matched.push(SERVICE_CARDS[2]);
  if (lower.includes('spotify family')) matched.push(SERVICE_CARDS[3]);
  // If mentions plans broadly, show all
  if (matched.length === 0 && (lower.includes('plans available') || lower.includes('following plans') || lower.includes('available plans'))) {
    return SERVICE_CARDS;
  }
  return matched;
}

function AssistantMessage({ content }: { content: string }) {
  const cards = detectServiceCards(content);
  // Strip markdown bullet items that match service names to avoid duplication
  let cleanContent = content;
  if (cards.length > 0) {
    cleanContent = content
      .split('\n')
      .filter(line => {
        const l = line.toLowerCase();
        return !cards.some(c => l.includes(c.name.toLowerCase()) && (l.startsWith('*') || l.startsWith('-')));
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  return (
    <div className="space-y-2">
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_p]:mb-1 [&_p:last-child]:mb-0">
        <ReactMarkdown>{cleanContent}</ReactMarkdown>
      </div>
      {cards.length > 0 && (
        <div className="grid gap-1.5 pt-1">
          {cards.map(card => (
            <Link key={card.name} to={card.link} className="block">
              <div className={`${card.color} rounded-lg px-3 py-2 flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer`}>
                <card.icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">{card.name}</p>
                  <p className="text-[10px] opacity-80">{card.price}</p>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! 👋 Ask me about Netflix, Spotify plans, or how to order.' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message: userMsg.content }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Sorry, I couldn't process that. Please try again.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Try again in a moment!",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
            style={{ maxHeight: '28rem' }}
          >
            <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm">StreamHub Assistant</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-background hover:text-background/80" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md text-sm'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <AssistantMessage content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about our plans..."
                className="flex-1 text-sm"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="bg-foreground text-background hover:bg-foreground/90">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full bg-foreground text-background shadow-xl hover:bg-foreground/90 hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
