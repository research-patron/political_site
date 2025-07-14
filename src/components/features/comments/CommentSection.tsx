"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageCircle, Flag, MoreHorizontal } from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/useAuth"
import { getComments, addComment, likeComment, unlikeComment } from "@/lib/firebase/firestore"
import { Comment } from "@/types"
import { formatRelativeTime } from "@/lib/utils"

const commentSchema = z.object({
  text: z.string()
    .min(1, "コメントを入力してください")
    .max(1000, "コメントは1000文字以内で入力してください"),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentSectionProps {
  candidateId: string
  policyId?: string
  preview?: boolean
  maxComments?: number
}

export function CommentSection({ 
  candidateId, 
  policyId, 
  preview = false, 
  maxComments = preview ? 3 : undefined 
}: CommentSectionProps) {
  const { user, userData } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  useEffect(() => {
    if (!candidateId) return

    const unsubscribe = getComments(candidateId, (newComments) => {
      const filteredComments = policyId 
        ? newComments.filter(comment => comment.policyId === policyId)
        : newComments.filter(comment => !comment.policyId)
      
      const limitedComments = maxComments 
        ? filteredComments.slice(0, maxComments)
        : filteredComments
      
      setComments(limitedComments)
      setIsLoading(false)
    }, policyId)

    return unsubscribe
  }, [candidateId, policyId, maxComments])

  const onSubmit = async (data: CommentFormData) => {
    if (!user || !userData) return

    setIsSubmitting(true)
    try {
      await addComment({
        candidateId,
        policyId,
        userId: user.uid,
        userName: userData.name,
        userAvatar: userData.avatar,
        text: data.text,
        moderationScore: 0.9, // Mock moderation score
      })
      reset()
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) return

    try {
      if (isLiked) {
        await unlikeComment(commentId, user.uid)
      } else {
        await likeComment(commentId, user.uid)
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex space-x-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {!preview && user && (
        <Card className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData?.avatar} />
                <AvatarFallback>{userData?.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  {...register("text")}
                  placeholder={policyId 
                    ? "この政策についてあなたの意見を聞かせてください..." 
                    : "この候補者についてあなたの意見を聞かせてください..."
                  }
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting}
                />
                {errors.text && (
                  <p className="text-sm text-destructive mt-1">{errors.text.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                建設的な議論を心がけましょう。不適切な投稿は自動的に非表示になります。
              </p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Login Prompt */}
      {!preview && !user && (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground mb-4">
            コメントを投稿するにはログインが必要です
          </p>
          <Button variant="outline">ログイン</Button>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.uid}
              onLike={handleLike}
              isPreview={preview}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">まだコメントがありません</h3>
            <p className="text-muted-foreground">
              {policyId ? 'この政策' : 'この候補者'}について最初にコメントしてみませんか？
            </p>
          </Card>
        )}
      </div>

      {/* Show More Button for Preview */}
      {preview && comments.length === maxComments && (
        <div className="text-center">
          <Button variant="outline">すべてのコメントを見る</Button>
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onLike: (commentId: string, isLiked: boolean) => void
  isPreview?: boolean
}

function CommentItem({ comment, currentUserId, onLike, isPreview }: CommentItemProps) {
  const isLiked = currentUserId ? comment.likedBy?.includes(currentUserId) : false

  return (
    <Card className="p-4">
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>{comment.userName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{comment.userName}</h4>
              {comment.moderationScore && comment.moderationScore > 0.95 && (
                <Badge variant="secondary" className="text-xs">
                  信頼できるユーザー
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <time className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt.toDate())}
              </time>
              {!isPreview && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      報告
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{comment.text}</p>
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => onLike(comment.id, isLiked)}
              disabled={!currentUserId || isPreview}
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likes || 0}
            </Button>
            {!isPreview && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4 mr-1" />
                返信
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}