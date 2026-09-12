'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Send, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getReviews, submitReview, markReviewHelpful, getAverageRating } from '@/lib/firestore';
import type { DestinationReview } from '@/lib/firestoreSchema';

interface ReviewSectionProps {
    destId: string;
    destName: string;
}

// Reviews are loaded from Firestore only — never seeded with fabricated data.
const EMPTY_REVIEWS: DestinationReview[] = [];

function StarRating({ rating, size = 'sm', interactive = false, onChange }: {
    rating: number; size?: 'sm' | 'md' | 'lg'; interactive?: boolean; onChange?: (r: number) => void;
}) {
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(star)}
                    className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                >
                    <Star
                        className={`${sizes[size]} ${
                            star <= rating
                                ? 'text-saffron-400 fill-saffron-400'
                                : 'text-muted-300 dark:text-muted-600'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ReviewSection({ destId, destName }: ReviewSectionProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<DestinationReview[]>(EMPTY_REVIEWS);
    const [avgRating, setAvgRating] = useState({ avg: 0, count: 0 });
    const [showForm, setShowForm] = useState(false);
    const [expandedReview, setExpandedReview] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('helpful');
    const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());

    // Form state
    const [formRating, setFormRating] = useState(5);
    const [formTitle, setFormTitle] = useState('');
    const [formBody, setFormBody] = useState('');
    const [formPros, setFormPros] = useState('');
    const [formCons, setFormCons] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load reviews from Firestore
    useEffect(() => {
        if (!destId) return;
        let isMounted = true;
        
        getReviews(destId).then(fsReviews => {
            if (isMounted && fsReviews.length > 0) {
                setReviews(fsReviews);
            }
        });
        getAverageRating(destId).then(r => {
            if (isMounted && r.count > 0) setAvgRating(r);
        });

        return () => { isMounted = false; };
    }, [destId]);

    // Sort reviews
    const sortedReviews = [...reviews].sort((a, b) => {
        if (sortBy === 'helpful') return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // recent = default order from Firestore
    });

    // Rating distribution
    const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
    }));

    const handleSubmit = async () => {
        if (!user || !formTitle.trim() || !formBody.trim()) return;
        setSubmitting(true);
        try {
            await submitReview(destId, {
                userId: user.uid,
                userName: user.displayName || 'Traveler',
                userPhoto: user.photoURL || '',
                destId,
                destName,
                rating: formRating,
                title: formTitle,
                body: formBody,
                travelDate: new Date().toISOString().slice(0, 7),
                group: 'solo',
                budget: 'mid-range',
                pros: formPros.split(',').map(s => s.trim()).filter(Boolean),
                cons: formCons.split(',').map(s => s.trim()).filter(Boolean),
            });
            // Refresh
            const fresh = await getReviews(destId);
            if (fresh.length > 0) setReviews(fresh);
            setShowForm(false);
            setFormTitle(''); setFormBody(''); setFormPros(''); setFormCons('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleHelpful = async (reviewId: string) => {
        if (helpedIds.has(reviewId)) return;
        setHelpedIds(prev => new Set(prev).add(reviewId));
        setReviews(prev => prev.map(r =>
            r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
        ));
        await markReviewHelpful(destId, reviewId);
    };

    return (
        <section className="mt-16 mb-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-muted-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-saffron-500" /> Traveler Reviews
                    </h2>
                    <p className="text-sm text-muted-500 mt-1">{avgRating.count > 0 ? `${avgRating.count} reviews · ${avgRating.avg} average` : 'No reviews yet'}</p>
                </div>
                {user && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-saffron-500 text-white rounded-xl text-sm font-semibold hover:bg-saffron-600 transition-colors shadow-lg shadow-saffron-500/20"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Average rating */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-muted-200 dark:border-white/10">
                    <div className="text-5xl font-bold text-muted-900 dark:text-white mb-2">{avgRating.count > 0 ? avgRating.avg : '—'}</div>
                    <StarRating rating={Math.round(avgRating.avg)} size="md" />
                    <p className="text-sm text-muted-500 mt-1">{avgRating.count} reviews</p>
                </div>

                {/* Distribution */}
                <div className="col-span-2 p-6 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-muted-200 dark:border-white/10">
                    {distribution.map(d => (
                        <div key={d.star} className="flex items-center gap-3 mb-1.5">
                            <span className="text-sm font-medium text-muted-600 dark:text-muted-400 w-6">{d.star}★</span>
                            <div className="flex-1 h-2.5 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                                <div className="h-full bg-saffron-400 rounded-full transition-all duration-500" style={{ width: `${d.pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-500 w-8">{d.pct}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2 mb-6">
                {(['helpful', 'recent', 'rating'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            sortBy === s
                                ? 'bg-saffron-500 text-white'
                                : 'bg-muted-100 dark:bg-muted-800 text-muted-600 dark:text-muted-400 hover:bg-muted-200 dark:hover:bg-muted-700'
                        }`}
                    >
                        {s === 'helpful' ? 'Most Helpful' : s === 'recent' ? 'Most Recent' : 'Highest Rated'}
                    </button>
                ))}
            </div>

            {/* Write Review Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-8 overflow-hidden"
                    >
                        <div className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-saffron-500/30 space-y-4">
                            <h3 className="font-bold text-lg text-muted-900 dark:text-white">Share Your Experience</h3>
                            <div>
                                <label className="text-sm text-muted-600 dark:text-muted-400 mb-1 block">Rating</label>
                                <StarRating rating={formRating} size="lg" interactive onChange={setFormRating} />
                            </div>
                            <input
                                type="text"
                                placeholder="Review title"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-muted-50 dark:bg-muted-800 border border-muted-200 dark:border-muted-700 text-muted-900 dark:text-white placeholder-muted-400 text-sm"
                            />
                            <textarea
                                placeholder="Tell others about your experience..."
                                value={formBody}
                                onChange={e => setFormBody(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-muted-50 dark:bg-muted-800 border border-muted-200 dark:border-muted-700 text-muted-900 dark:text-white placeholder-muted-400 text-sm resize-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Pros (comma-separated)" value={formPros} onChange={e => setFormPros(e.target.value)} className="px-4 py-3 rounded-xl bg-muted-50 dark:bg-muted-800 border border-muted-200 dark:border-muted-700 text-muted-900 dark:text-white placeholder-muted-400 text-sm" />
                                <input type="text" placeholder="Cons (comma-separated)" value={formCons} onChange={e => setFormCons(e.target.value)} className="px-4 py-3 rounded-xl bg-muted-50 dark:bg-muted-800 border border-muted-200 dark:border-muted-700 text-muted-900 dark:text-white placeholder-muted-400 text-sm" />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !formTitle.trim() || !formBody.trim()}
                                className="px-6 py-3 bg-saffron-500 text-white rounded-xl font-semibold text-sm hover:bg-saffron-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Cards */}
            <div className="space-y-4">
                {sortedReviews.length === 0 && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-muted-300 dark:border-muted-700 bg-white/40 dark:bg-white/5">
                        <MessageSquare className="w-8 h-8 text-muted-300 dark:text-muted-600 mx-auto mb-3" />
                        <p className="font-semibold text-muted-700 dark:text-muted-200 mb-1">No reviews yet</p>
                        <p className="text-sm text-muted-500 dark:text-muted-400">
                            {user ? 'Be the first to share your experience!' : 'Be the first to share your experience when you visit.'}
                        </p>
                    </div>
                )}
                {sortedReviews.map((review, i) => (
                    <motion.div
                        key={review.id || i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-muted-200 dark:border-white/10"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {review.userPhoto ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={review.userPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    review.userName.charAt(0)
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-muted-900 dark:text-white">{review.userName}</span>
                                    <StarRating rating={review.rating} size="sm" />
                                </div>
                                <p className="text-xs text-muted-500">{review.travelDate} · {review.group} · {review.budget}</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-muted-900 dark:text-white mb-1">{review.title}</h4>
                        <p className={`text-sm text-muted-600 dark:text-muted-400 leading-relaxed ${
                            expandedReview !== review.id ? 'line-clamp-3' : ''
                        }`}>
                            {review.body}
                        </p>
                        {review.body.length > 200 && (
                            <button
                                onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id!)}
                                className="text-saffron-500 text-xs font-semibold mt-1 flex items-center gap-1"
                            >
                                {expandedReview === review.id ? <>Less <ChevronUp className="w-3 h-3" /></> : <>More <ChevronDown className="w-3 h-3" /></>}
                            </button>
                        )}

                        {/* Pros & Cons */}
                        {(review.pros?.length > 0 || review.cons?.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {review.pros?.map((p, j) => (
                                    <span key={`p${j}`} className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs rounded-lg">✓ {p}</span>
                                ))}
                                {review.cons?.map((c, j) => (
                                    <span key={`c${j}`} className="px-2 py-0.5 bg-temple-red-50 dark:bg-temple-red-500/10 text-temple-red-700 dark:text-temple-red-400 text-xs rounded-lg">✗ {c}</span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-muted-100 dark:border-white/5">
                            <button
                                onClick={() => review.id && handleHelpful(review.id)}
                                disabled={helpedIds.has(review.id || '')}
                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    helpedIds.has(review.id || '')
                                        ? 'text-saffron-500'
                                        : 'text-muted-400 hover:text-saffron-500'
                                }`}
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Helpful ({review.helpfulCount || 0})
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
