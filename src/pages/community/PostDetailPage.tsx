import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostDetail } from '@/components/community/PostDetail';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  if (!postId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubscribe = () => {
    // PostDetail will call this - we don't need the artistId param here
    // as PostDetail has access to it internally
  };

  const handleSeeTiers = () => {
    // Same as above
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <PostDetail
          postId={postId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default PostDetailPage;
