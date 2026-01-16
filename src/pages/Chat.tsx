import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Bot, User, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from "axios"
import { BASE_URL } from '@/utils/constants';
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  _id: string;
  name: string;
  systemPrompt: string;
}

export default function Chat() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const { authFetch } = useApi();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const projects = await authFetch('/projects');
      const found = projects.find((p: Project) => p._id === projectId);
      if (found) {
        setProject(found);
      } else {
        toast({ title: 'Project not found', variant: 'destructive' });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({ title: 'Failed to load project', variant: 'destructive' });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || isSending) return;

    setIsSending(true);

    const userMessage: Message = {
      role: 'user',
      content: input || 'Please analyze the uploaded file'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      const formData = new FormData();
      formData.append('projectId', projectId!);
      formData.append('messages', JSON.stringify(updatedMessages));

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await axios.post(
        BASE_URL + '/chat',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ]);

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (e) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-chat-bg">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">{project?.name}</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-medium mb-2">Start a conversation</h2>
              <p className="text-muted-foreground text-sm">
                Send a message to begin chatting with your AI assistant
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                  ? 'bg-chat-user text-white'
                  : 'bg-chat-assistant border'
                  }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-chat-assistant border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-background border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">

          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileSelect}
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          {selectedFile && (
            <div className="text-xs text-muted-foreground px-2">
              {selectedFile.name}
            </div>
          )}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
