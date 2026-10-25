# Device test checklist

The things a script can't check. Do this on a real phone with a release or preview build, ideally one low-cost Android phone and one iPhone. Note the phone, OS version and date at the top of your copy.

## 1. Sign in and session
- [ ] Wrong password shows a clear error and keeps what was typed.
- [ ] Sign in works; killing and reopening the app keeps you signed in.
- [ ] Airplane mode, then open the app: still signed in, offline banner shows.
- [ ] Turn the connection back on: jobs refresh by themselves.
- [ ] Sign out: you land on login. Press the back button: you stay on login.
- [ ] Sign in as a different account: no jobs, payout number or notifications from the first.

## 2. Jobs and the delivery flow
- [ ] Go online by sliding. The thumb snaps cleanly and the glow shows.
- [ ] A new job appears within about 30 seconds and the new-job alert shows.
- [ ] Accept a job; run every step to the end. Close the app during "Pay the vendor": reopening returns to that step.
- [ ] Paste "Your code is 123456" into the code box: only 123456 stays.
- [ ] A wrong code shows an error and does not complete the job.
- [ ] Mark a delivery failed with a reason; the recovery screen makes sense.

## 3. Screens and states
- [ ] Every main screen on a small phone (about 5 inches) and a large one: nothing cut off, nothing hidden by the navigation bar.
- [ ] All three navigation styles (floating, docked, compact) and the floating positions.
- [ ] Light mode, dark mode, and "system". Restart the app: your choice is kept.
- [ ] Open a job that no longer exists (old link or notification): you see a fallback, not a crash.
- [ ] Rotate the phone: the app stays upright.

## 4. Accessibility
- [ ] Turn on TalkBack (Android) or VoiceOver (iPhone) and sign in using only the screen reader.
- [ ] Every button, switch and field is announced with a sensible name.
- [ ] The stepper reads as "Step 3 of 6: …, current step".
- [ ] Set the phone's font size to the largest: text wraps, buttons stay usable.
- [ ] Turn on "reduce motion" / "remove animations": no pulsing or looping animation remains.
- [ ] Text is readable in bright sunlight at full brightness (contrast).
- [ ] Buttons are easy to hit with a thumb while walking (about 44 points or larger).

## 5. Permissions and privacy
- [ ] Add a document with the camera: the permission prompt appears only then.
- [ ] Deny it, reopen Permissions: it shows Denied. Allow it in Settings and come back: Allowed.
- [ ] "Request account deletion" opens an email to support with your account email filled in.

## 6. Performance (write the numbers down)
- [ ] Cold start to the first usable screen: ___ seconds (mid-range Android, release build, good connection).
- [ ] Same with a slow connection: ___ seconds.
- [ ] Scrolling the jobs, wallet and notifications lists feels smooth (no visible stutter).
- [ ] Leave the app online for 30 minutes: the phone doesn't get hot and battery drain is reasonable. Note the percentage lost: ___.

## 7. Interruptions
- [ ] Receive a phone call mid-delivery; come back to the same step.
- [ ] Switch to another app for five minutes and back: the jobs refresh.
- [ ] Low battery mode on: the app still works.
