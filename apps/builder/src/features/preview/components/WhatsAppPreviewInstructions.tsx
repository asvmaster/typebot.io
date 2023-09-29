import { TextInput } from '@/components/inputs'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { useToast } from '@/hooks/useToast'
import { trpc } from '@/lib/trpc'
import {
  Alert,
  AlertIcon,
  Button,
  HStack,
  Link,
  SlideFade,
  Stack,
  StackProps,
  Text,
} from '@chakra-ui/react'
import { isEmpty } from '@typebot.io/lib'
import { FormEvent, useState } from 'react'
import {
  getPhoneNumberFromLocalStorage,
  setPhoneNumberInLocalStorage,
} from '../helpers/phoneNumberFromLocalStorage'
import { useEditor } from '@/features/editor/providers/EditorProvider'

export const WhatsAppPreviewInstructions = (props: StackProps) => {
  const { typebot, save } = useTypebot()
  const { startPreviewAtGroup } = useEditor()
  const [phoneNumber, setPhoneNumber] = useState(
    getPhoneNumberFromLocalStorage() ?? ''
  )
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isMessageSent, setIsMessageSent] = useState(false)
  const [hasMessageBeenSent, setHasMessageBeenSent] = useState(false)

  const { showToast } = useToast()
  const { mutate } = trpc.whatsApp.startWhatsAppPreview.useMutation({
    onMutate: () => setIsSendingMessage(true),
    onSettled: () => setIsSendingMessage(false),
    onError: (error) => showToast({ description: error.message }),
    onSuccess: async (data) => {
      if (
        data?.message === 'success' &&
        phoneNumber !== getPhoneNumberFromLocalStorage()
      )
        setPhoneNumberInLocalStorage(phoneNumber)
      setHasMessageBeenSent(true)
      setIsMessageSent(true)
      setTimeout(() => setIsMessageSent(false), 30000)
    },
  })

  const sendWhatsAppPreviewStartMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!typebot) return
    await save()
    mutate({
      to: phoneNumber,
      typebotId: typebot.id,
      startGroupId: startPreviewAtGroup,
    })
  }

  return (
    <Stack
      as="form"
      spacing={4}
      overflowY="scroll"
      className="hide-scrollbar"
      w="full"
      px="1"
      onSubmit={sendWhatsAppPreviewStartMessage}
      {...props}
    >
      <Alert status="warning">
        <AlertIcon />
        The WhatsApp integration is still experimental.
        <br />I appreciate your bug reports 🧡
      </Alert>
      <TextInput
        label="Your phone number"
        placeholder="+XXXXXXXXXXXX"
        type="tel"
        withVariableButton={false}
        debounceTimeout={0}
        defaultValue={phoneNumber}
        onChange={setPhoneNumber}
      />
      {!isMessageSent && (
        <Button
          isDisabled={isEmpty(phoneNumber) || isMessageSent}
          isLoading={isSendingMessage}
          type="submit"
        >
          {hasMessageBeenSent ? 'Restart' : 'Start'} the chat
        </Button>
      )}
      <SlideFade offsetY="20px" in={isMessageSent} unmountOnExit>
        <Stack>
          <Alert status="success" w="100%">
            <HStack>
              <AlertIcon />
              <Stack spacing={1}>
                <Text fontWeight="semibold">Chat started!</Text>
                <Text fontSize="sm">
                  The first message can take up to 2 min to be delivered.
                </Text>
              </Stack>
            </HStack>
          </Alert>
          <Button
            as={Link}
            href={`https://web.whatsapp.com/`}
            isExternal
            size="sm"
            colorScheme="blue"
          >
            Open WhatsApp Web
          </Button>
        </Stack>
      </SlideFade>
    </Stack>
  )
}
