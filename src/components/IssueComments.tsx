import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageSquare, Shield, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'volunteer' | 'reporter';
  timestamp: any;
}

interface IssueCommentsProps {
  issueId: string;
}

export const IssueComments: React.FC<IssueCommentsProps> = ({ issueId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!issueId) return;

    const commentsRef = collection(db, 'issues', issueId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [issueId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !profile || isSending) return;

    setIsSending(true);
    try {
      const commentsRef = collection(db, 'issues', issueId, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        authorId: user.uid,
        authorName: profile.name || 'Unknown Personnel',
        authorRole: profile.role,
        timestamp: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to send comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Tactical Log</h3>
        </div>
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-60">
          Live Connection
        </div>
      </div>

      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-[var(--bg)]/30"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)] opacity-50" />
          </div>
        ) : comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-2">
            <MessageSquare className="w-6 h-6" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No signals recorded</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = comment.authorId === user?.uid;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={comment.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {comment.authorRole === 'admin' ? (
                    <Shield className="w-2.5 h-2.5 text-[var(--accent)]" />
                  ) : (
                    <User className="w-2.5 h-2.5 text-[var(--text-secondary)]" />
                  )}
                  <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                    {comment.authorName} ({comment.authorRole})
                  </span>
                </div>
                <div className={`
                  max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed
                  ${isMe 
                    ? 'bg-[var(--accent)] text-white rounded-tr-none' 
                    : 'bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'}
                `}>
                  {comment.text}
                </div>
                <div className="text-[8px] font-bold text-[var(--text-secondary)] opacity-50 uppercase tracking-widest">
                  {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Transmit status update..."
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-4 pr-12 text-sm font-medium focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]/30"
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="absolute right-2 p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-all disabled:opacity-30"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};
