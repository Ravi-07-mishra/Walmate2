'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { registerUser, loginUser } from '@/lib/api';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type AuthFormProps = {
  type: 'login' | 'signup';
};

export default function AuthForm({ type }: AuthFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isLogin = type === 'login';
  const formSchema = isLogin ? loginSchema : signupSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isLogin
      ? { username: '', password: '' }
      : { username: '', email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        const { access_token } = await loginUser(values.username, values.password);
        localStorage.setItem('token', access_token);

        // ✅ Dispatch custom event to notify AppHeader
        window.dispatchEvent(new Event('authChanged'));

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });

        router.push('/');
      } else {
        const { access_token } = await registerUser(
          values.username,
          values.email,
          values.password
        );
        localStorage.setItem('token', access_token);

        // ✅ Dispatch custom event to notify AppHeader
        window.dispatchEvent(new Event('authChanged'));

        toast({
          title: 'Signup Successful',
          description: 'Your account has been created!',
        });

        router.push('/preferences');
      }
    } catch (error: any) {
      let errorMessage = 'Something went wrong';

      if (error.message) {
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj.detail) {
            errorMessage = errorObj.detail;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message || 'Something went wrong';
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? 'Enter your credentials to access your account.'
            : 'Enter your information to get started.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            {!isLogin && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john_doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col gap-4">
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Link href={isLogin ? '/signup' : '/login'} className="underline ml-1">
              {isLogin ? 'Sign up' : 'Login'}
            </Link>
          </div>
          {isLogin && (
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
              Forgot password?
            </Link>
          )}
        </CardFooter>
      </Form>
    </Card>
  );
}
