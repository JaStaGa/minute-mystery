import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const metadata = { title: "Home" };

export default function Home() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Minute Mystery</h1>

        <Alert>
          <AlertTitle>UI check</AlertTitle>
          <AlertDescription>shadcn components rendered.</AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Sample form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Type here" />
            <Progress value={66} />
          </CardContent>
          <CardFooter className="gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
          </CardFooter>
        </Card>

        <p className="text-sm text-zinc-400">If this looks styled, Tailwind works.</p>
      </div>
    </main>
  );
}
