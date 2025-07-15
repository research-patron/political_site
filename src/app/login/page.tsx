"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Mail, Phone, Chrome } from 'lucide-react'
import { signIn, signInWithGoogle, setupRecaptcha, sendPhoneVerification, verifyPhoneCode } from '@/lib/firebase/auth'
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'

export default function LoginPage() {
  // Email/Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  
  // Common state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('email')
  const router = useRouter()

  useEffect(() => {
    // Phone認証用のreCAPTCHA設定
    if (activeTab === 'phone' && !recaptchaVerifier) {
      try {
        const verifier = setupRecaptcha('recaptcha-container')
        setRecaptchaVerifier(verifier)
      } catch (error) {
        console.error('reCAPTCHA setup error:', error)
      }
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [activeTab, recaptchaVerifier])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/')
    } catch (error: any) {
      console.error('Email login error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      router.push('/')
    } catch (error: any) {
      console.error('Google login error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!showVerificationInput) {
        // SMS送信
        if (!recaptchaVerifier) {
          throw new Error('reCAPTCHA verifier not initialized')
        }
        
        const confirmation = await sendPhoneVerification(phoneNumber, recaptchaVerifier)
        setConfirmationResult(confirmation)
        setShowVerificationInput(true)
        setError('')
      } else {
        // 認証コード確認
        if (!confirmationResult) {
          throw new Error('Confirmation result not available')
        }
        
        await verifyPhoneCode(confirmationResult, verificationCode)
        router.push('/')
      }
    } catch (error: any) {
      console.error('Phone login error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = (error: any) => {
    const errorCode = error.code
    switch (errorCode) {
      case 'auth/user-not-found':
        setError('このメールアドレスで登録されたアカウントが見つかりません。')
        break
      case 'auth/wrong-password':
        setError('パスワードが正しくありません。')
        break
      case 'auth/invalid-email':
        setError('無効なメールアドレスです。')
        break
      case 'auth/user-disabled':
        setError('このアカウントは無効化されています。')
        break
      case 'auth/too-many-requests':
        setError('ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください。')
        break
      case 'auth/invalid-phone-number':
        setError('無効な電話番号です。')
        break
      case 'auth/missing-phone-number':
        setError('電話番号を入力してください。')
        break
      case 'auth/invalid-verification-code':
        setError('認証コードが正しくありません。')
        break
      case 'auth/popup-closed-by-user':
        setError('認証がキャンセルされました。')
        break
      case 'auth/popup-blocked':
        setError('ポップアップがブロックされました。ポップアップを許可して再試行してください。')
        break
      default:
        setError('ログインに失敗しました。入力内容を確認してください。')
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            アカウントにログイン
          </h1>
          <p className="text-sm text-muted-foreground">
            お好みの方法でログインしてください
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" className="text-xs">
                  <Mail className="h-4 w-4 mr-1" />
                  メール
                </TabsTrigger>
                <TabsTrigger value="google" className="text-xs">
                  <Chrome className="h-4 w-4 mr-1" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="phone" className="text-xs">
                  <Phone className="h-4 w-4 mr-1" />
                  電話番号
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="パスワードを入力"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ログイン
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="google" className="space-y-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Googleアカウントでログインします
                  </p>
                  <Button 
                    onClick={handleGoogleLogin} 
                    className="w-full" 
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Googleでログイン
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-4">
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  {!showVerificationInput ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone">電話番号</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+81 90-1234-5678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          +81から始まる日本の電話番号を入力してください
                        </p>
                      </div>
                      
                      <div id="recaptcha-container"></div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        認証コードを送信
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">認証コード</Label>
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="6桁のコードを入力"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          required
                          disabled={loading}
                          maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          {phoneNumber} に送信された6桁のコードを入力してください
                        </p>
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        ログイン
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setShowVerificationInput(false)
                          setVerificationCode('')
                          setConfirmationResult(null)
                        }}
                        disabled={loading}
                      >
                        電話番号を変更
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="border-red-200 bg-red-50 mt-4">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="underline underline-offset-4 hover:text-primary">
            新規登録
          </Link>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}