'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AboutPlatform } from '@/components/about/about-platform';
import { LoginButtonGitHub } from '@/components/auth/login/login-button-github';
import { LoginButtonGoogle } from '@/components/auth/login/login-button-google';

import { Separator } from '../../ui/separator';
import { LoginEmailForm } from './email-login-form';

import { siteConfig } from '@/config/site-base';

// const formSchema = z.object({
//   email: z.string().email({
//     message: 'Invalid email 🥺',
//   }),
//   password: z.string().min(5, {
//     message: 'Minimum length not met',
//   }),
// });

// type LoginEmailFormProps = {
//   className?: string;
// };

// const LoginEmailForm = ({ className }: LoginEmailFormProps) => {
//   // 0. State for tracking success/error state
//   const [isSuccess, setIsSuccess] = useLocalStorage<boolean | null>(
//     'dasco-login',
//     null
//   );
//   const [submitResponseMsg, setSubmitResponseMsg] = useState('');

//   // 1. Define your form.
//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: '',
//       password: '',
//     },
//     mode: 'onSubmit',
//   });

//   const { formState, watch, getValues, reset } = form;
//   const { errors, isValid, isValidating, isSubmitting } = formState;

//   console.log(`formState`, {
//     errors,
//     isValid,
//     isValidating,
//     isSubmitting,
//   });
//   const hasErrors = Object.keys(errors).length > 0;

//   // 2. Define a submit handler.
//   async function onSubmit(values: z.infer<typeof formSchema>) {
//     if (!isValid) {
//       console.error(`Form is not valid`, errors);
//       return;
//     }

//     // Clear out any prior success/error state msgs
//     setSubmitResponseMsg('');

//     // Do something with the form values.
//     // ✅ This will be type-safe and validated.
//     const token = await getCsrfToken();
//     const payload = {
//       csrfToken: token,
//       ...values,
//     };
//     // console.log(`payload`, payload);
//     const response = await fetch('/api/auth/callback/credentials', {
//       method: 'POST',
//       body: JSON.stringify(payload),
//     }).then((res) => res.json());
//     // console.log(`login response`, response);

//     if (response.added) {
//       setIsSuccess(true);
//       if (response.message) {
//         setSubmitResponseMsg(response.message);
//       }
//       // // Clear the form
//       // reset();
//     } else {
//       setIsSuccess(false);
//       setSubmitResponseMsg(response.message!);
//     }
//     // await sleep(10000);
//   }

//   // Clearout the success message after 10 seconds
//   const handleSuccessClear = () => {
//     setIsSuccess(null);
//     setSubmitResponseMsg('');
//     // Clear the main form
//     reset();
//   };
//   // Will only run if isSuccess is true
//   const [] = useTimeoutFn(handleSuccessClear, isSuccess ? 10000 : undefined);

//   return (
//     <Form {...form}>
//       {isSuccess && (
//         <div className="flex w-full flex-col items-center gap-2 self-center">
//           <div className="flex w-32 flex-col items-center self-center">
//             <AnimatedSuccessCheck className="h-full w-full text-success-foreground" />
//           </div>
//           <h3 className="text-base">You're in!</h3>
//         </div>
//       )}
//       {submitResponseMsg && (
//         <Alert variant={isSuccess ? 'default' : 'destructive'}>
//           {submitResponseMsg}
//         </Alert>
//       )}
//       {!isSuccess && (
//         <form
//           onSubmit={form.handleSubmit(onSubmit)}
//           className={cn('flex flex-col gap-2', className)}
//         >
//           <div className="flex flex-col gap-4">
//             <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem className="w-full">
//                     <FormLabel>Email</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="Email"
//                         {...field}
//                         disabled={isSubmitting}
//                       />
//                     </FormControl>
//                     {!hasErrors && <FormDescription> </FormDescription>}
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem className="w-full">
//                     <FormLabel>Password</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="Secret login"
//                         {...field}
//                         type="password"
//                         disabled={isSubmitting}
//                       />
//                     </FormControl>
//                     {!hasErrors && <FormDescription> </FormDescription>}
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//           </div>
//           <div className="flex justify-end">
//             <Button
//               type="submit"
//               size="sm"
//               disabled={isSubmitting}
//               variant={isValid ? 'default' : 'secondary'}
//               className={cn('w-full gap-1.5 sm:w-fit', {
//                 'cursor-default': !isValid,
//               })}
//             >
//               {/* Icons */}
//               {isValid && !isSubmitting && <IconEmailPaperAirplane />}
//               {!isValid && !isSubmitting && <span>👆🏽</span>}
//               {isSubmitting && <IconSpinner className="" />}
//               {/* Text */}
//               {isValid && !isSubmitting && 'Login'}
//               {!isValid && 'Complete Info'}
//               {isSubmitting && 'Going to Space and Back...'}
//             </Button>
//           </div>
//         </form>
//       )}
//     </Form>
//   );
// };

export type DialogUserLoginProps = {
  title?: string;
  instructions?: string;
  redirectPath?: string;
};

export function DialogUserLogin({
  title = siteConfig.ui.login.title,
  instructions = siteConfig.ui.login.instructions,
  redirectPath,
}: DialogUserLoginProps) {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const urlRedirectPath = searchParams.get('callbackUrl');
  if (!redirectPath && urlRedirectPath) {
    redirectPath = urlRedirectPath;
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Dialog open={isMounted}>
        <DialogContent
          className="bg-background/95 shadow-2xl"
          overlayProps={{
            className: 'backdrop-blur-[2px]',
          }}
          lightOverlay
          noCloseBtn
        >
          <DialogHeader className="space-y-2">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-base">
              {instructions}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex w-full flex-col items-stretch gap-2">
              <div className="flex flex-row items-stretch justify-center gap-4 py-4 sm:flex-row sm:items-center">
                {/* <LoginButtonGoogle variant="default" /> */}
                <LoginButtonGoogle
                  variant="default"
                  text="Google"
                  callbackUrl={redirectPath}
                />
                <LoginButtonGitHub
                  variant="default"
                  text="GitHub"
                  callbackUrl={redirectPath}
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Separator className="max-w-[15%]" />
              <span>OR</span>
              <Separator className="max-w-[15%]" />
            </div>
            <LoginEmailForm
              redirectPath={redirectPath}
              className="sm:mx-auto sm:max-w-[84%]"
            />
          </div>
          <DialogFooter className="w-full flex-row-reverse justify-between gap-6 sm:justify-center">
            <AboutPlatform btnTriggerVariant="secondary" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
