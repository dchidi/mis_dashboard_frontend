import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { RiAlertLine, RiLockPasswordLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center
      mih="100vh"
      px="md"
      style={{
        background:
          "radial-gradient(circle at top, rgba(104, 90, 220, 0.18), transparent 34%), linear-gradient(180deg, #1b1d28 0%, #12141d 100%)",
      }}
    >
      <Paper
        maw={420}
        p="xl"
        radius="xl"
        shadow="xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(49, 53, 69, 0.96), rgba(37, 40, 54, 0.96))",
          border: "1px solid rgba(126, 116, 196, 0.18)",
          width: "100%",
        }}
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text c="dimmed" fw={700} size="sm" tt="uppercase">
              Dashboard Access
            </Text>
            <Title c="white" order={1}>
              Sign in
            </Title>
            <Text c="rgba(214, 219, 242, 0.78)" size="sm">
              Use your existing backend account to access the v2 dashboards and
              reports.
            </Text>
          </Stack>

          {errorMessage ? (
            <Alert
              color="red"
              icon={<RiAlertLine />}
              radius="lg"
              variant="light"
            >
              {errorMessage}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                autoComplete="username"
                label="Email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="name@company.com"
                required
                styles={{
                  input: {
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(118, 109, 177, 0.18)",
                    color: "#f5f7ff",
                    height: "3rem",
                  },
                  label: { color: "#f5f7ff", fontWeight: 700 },
                }}
                type="email"
                value={email}
              />

              <PasswordInput
                autoComplete="current-password"
                label="Password"
                leftSection={<RiLockPasswordLine />}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder="Enter password"
                required
                styles={{
                  input: {
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(118, 109, 177, 0.18)",
                    color: "#f5f7ff",
                    height: "3rem",
                  },
                  label: { color: "#f5f7ff", fontWeight: 700 },
                }}
                value={password}
              />

              <Button
                fullWidth
                loading={isSubmitting}
                mt="sm"
                radius="xl"
                size="md"
                type="submit"
              >
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
};

export default Login;
