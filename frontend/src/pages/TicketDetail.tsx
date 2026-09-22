import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ArrowLeft, User, Clock, Send, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

interface TicketDetail {
  id: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  customer: { id: number; name: string; email: string };
  assignedTo?: { id: number; name: string; email: string } | null;
  comments: Comment[];
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Agent update state
  const [updating, setUpdating] = useState(false);
  const [allAgents, setAllAgents] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchTicket();
    if (user?.role === 'AGENT') {
      fetchAgents();
    }
  }, [id, user]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await api.get('/users');
      // Filter out only agents/admins from the users list
      setAllAgents(res.data.filter((u: any) => u.role === 'AGENT'));
    } catch (err) {
      console.error("Failed to load agents", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const res = await api.post(`/tickets/${id}/comments`, { content: newComment });
      // Append the new comment to the existing ticket state
      setTicket((prev) => prev ? { ...prev, comments: [...prev.comments, res.data] } : prev);
      setNewComment('');
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateTicket = async (field: string, value: any) => {
    setUpdating(true);
    try {
      const payload = { [field]: value };
      const res = await api.put(`/tickets/${id}`, payload);
      // Update ticket state with response
      setTicket((prev) => prev ? { ...prev, ...res.data } : prev);
    } catch (err) {
      console.error(`Failed to update ${field}`, err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center"><div className="text-slate-500">Loading ticket...</div></div>;
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col justify-center items-center">
        <div className="text-red-500 mb-4">{error || 'Ticket not found'}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const isAgent = user?.role === 'AGENT';
  const backLink = isAgent ? '/agent-dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={backLink} className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                #{ticket.id} {ticket.subject}
              </h1>
              <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                <User className="w-4 h-4" /> {ticket.customer.name}
                <span className="text-slate-300">|</span>
                <Clock className="w-4 h-4" /> {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            
            {/* Agent Controls */}
            {isAgent && (
              <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <select 
                  disabled={updating}
                  value={ticket.status} 
                  onChange={(e) => handleUpdateTicket('status', e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  <option value="OPEN">Status: Open</option>
                  <option value="IN_PROGRESS">Status: In Progress</option>
                  <option value="RESOLVED">Status: Resolved</option>
                  <option value="CLOSED">Status: Closed</option>
                </select>

                <select 
                  disabled={updating}
                  value={ticket.priority} 
                  onChange={(e) => handleUpdateTicket('priority', e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  <option value="LOW">Priority: Low</option>
                  <option value="MEDIUM">Priority: Medium</option>
                  <option value="HIGH">Priority: High</option>
                </select>

                <select 
                  disabled={updating}
                  value={ticket.assignedTo?.id || ''} 
                  onChange={(e) => handleUpdateTicket('assignedToId', e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  <option value="">Unassigned</option>
                  {allAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>Assignee: {agent.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Status Display (Read-only) */}
            {!isAgent && (
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200">
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200">
                  {ticket.priority} PRIORITY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Original Description</h3>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Discussion</h3>
          
          {ticket.comments.length === 0 ? (
            <div className="text-slate-500 italic text-center py-8 bg-white rounded-2xl border border-slate-200 border-dashed">
              No comments yet. Be the first to start the discussion.
            </div>
          ) : (
            <div className="space-y-4">
              {ticket.comments.map((comment) => {
                const isMyComment = comment.user.id === user?.id;
                const isAgentComment = comment.user.role === 'AGENT';

                return (
                  <div key={comment.id} className={clsx("flex flex-col max-w-[85%]", isMyComment ? "ml-auto items-end" : "mr-auto items-start")}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-sm font-medium text-slate-700">{isMyComment ? 'You' : comment.user.name}</span>
                      {isAgentComment && !isMyComment && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Agent
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={clsx(
                      "p-4 rounded-2xl shadow-sm whitespace-pre-wrap text-sm leading-relaxed",
                      isMyComment ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                    )}>
                      {comment.content}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* New Comment Input */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 pl-4 flex items-end gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your reply here..."
              className="flex-1 py-3 outline-none resize-none text-slate-700 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment(e as unknown as React.FormEvent);
                }
              }}
            />
            <button 
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()}
              className="p-3 mb-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;
