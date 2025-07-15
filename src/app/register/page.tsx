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
import { Loader2, Eye, EyeOff, CheckCircle2, Mail, Phone, Chrome } from 'lucide-react'
import { createUser, signInWithGoogle, setupRecaptcha, sendPhoneVerification, verifyPhoneCode } from '@/lib/firebase/auth'
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'

export default function RegisterPage() {
  // Email/Password state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  
  // Common state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // バリデーション
    if (!name.trim()) {
      setError('名前を入力してください。')
      setLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setError('パスワードは6文字以上で入力してください。')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      setLoading(false)
      return
    }

    try {
      await createUser(email, password, name)
      setSuccess(true)
      
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error: any) {
      console.error('Email registration error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      setSuccess(true)
      
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error: any) {
      console.error('Google registration error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneRegister = async (e: React.FormEvent) => {
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
        setSuccess(true)
        
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Phone registration error:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = (error: any) => {
    const errorCode = error.code
    switch (errorCode) {
      case 'auth/email-already-in-use':
        setError('このメールアドレスは既に登録されています。')
        break
      case 'auth/invalid-email':
        setError('無効なメールアドレスです。')
        break
      case 'auth/operation-not-allowed':
        setError('この認証方法は許可されていません。')
        break
      case 'auth/weak-password':
        setError('パスワードが弱すぎます。より安全なパスワードを設定してください。')
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
      case 'auth/account-exists-with-different-credential':
        setError('このメールアドレスは別の認証方法で既に登録されています。')
        break
      default:
        setError('アカウントの作成に失敗しました。入力内容を確認してください。')
    }
  }

  if (success) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <h2 className="text-xl font-semibold">登録完了！</h2>
                <p className="text-sm text-muted-foreground">
                  アカウントが正常に作成されました。<br />
                  自動的にホームページにリダイレクトします...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            アカウントを作成
          </h1>
          <p className="text-sm text-muted-foreground">
            お好みの方法でアカウントを作成してください
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
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="山田太郎"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

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
                        placeholder="6文字以上のパスワード"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="パスワードを再入力"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    アカウントを作成
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="google" className="space-y-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Googleアカウントでアカウントを作成します
                  </p>
                  <Button 
                    onClick={handleGoogleRegister} 
                    className="w-full" 
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Googleでアカウント作成
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-4">
                <form onSubmit={handlePhoneRegister} className="space-y-4">
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
                        アカウントを作成
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
          既にアカウントをお持ちですか？{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            ログイン
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