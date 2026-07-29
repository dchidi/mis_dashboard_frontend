import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { RiAlertLine, RiLockPasswordLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

const passwordInputStyles = {
  input: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(118, 109, 177, 0.18)",
    color: "#f5f7ff",
    height: "3rem",
  },
  label: { color: "#f5f7ff", fontWeight: 700 },
};

const Login: React.FC = () => {
  const {
    cancelRequiredPasswordChange,
    completeRequiredPasswordChange,
    login,
    passwordChangeUser,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      setPassword("");
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

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("The new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeRequiredPasswordChange(newPassword, confirmPassword);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAnotherAccount = () => {
    cancelRequiredPasswordChange();
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
  };

  const requiresPasswordChange = Boolean(passwordChangeUser);

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
        maw={440}
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
              {requiresPasswordChange ? "Account Security" : "Dashboard Access"}
            </Text>
            <Title c="white" order={1}>
              {requiresPasswordChange ? "Create a new password" : "Sign in"}
            </Title>
            <Text c="rgba(214, 219, 242, 0.78)" size="sm">
              {requiresPasswordChange
                ? `${passwordChangeUser?.full_name}, you must set a permanent password before continuing.`
                : "Use your system account to access the dashboards and reports."}
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

          {requiresPasswordChange ? (
            <form onSubmit={handlePasswordChange}>
              <Stack gap="md">
                <PasswordInput
                  autoComplete="new-password"
                  label="New Password"
                  leftSection={<RiLockPasswordLine />}
                  onChange={(event) => setNewPassword(event.currentTarget.value)}
                  placeholder="Enter a new password"
                  required
                  styles={passwordInputStyles}
                  value={newPassword}
                />

                <PasswordInput
                  autoComplete="new-password"
                  label="Confirm Password"
                  leftSection={<RiLockPasswordLine />}
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                  placeholder="Re-enter the new password"
                  required
                  styles={passwordInputStyles}
                  value={confirmPassword}
                />

                <Group grow mt="sm">
                  <Button
                    disabled={isSubmitting}
                    onClick={handleUseAnotherAccount}
                    radius="xl"
                    type="button"
                    variant="subtle"
                  >
                    Use another account
                  </Button>
                  <Button loading={isSubmitting} radius="xl" type="submit">
                    Update Password
                  </Button>
                </Group>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  autoComplete="username"
                  label="Email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="name@company.com"
                  required
                  styles={passwordInputStyles}
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
                  styles={passwordInputStyles}
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
          )}
        </Stack>
      </Paper>
    </Center>
  );
};

export default Login;
