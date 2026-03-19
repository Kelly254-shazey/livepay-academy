import { router } from 'expo-router';
import { Button, Heading, Screen, Surface } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Surface>
        <Heading
          body="This route does not exist in the current mobile workspace."
          eyebrow="Missing route"
          title="Not found"
        />
        <Button onPress={() => router.replace('/')} title="Go home" />
      </Surface>
    </Screen>
  );
}
