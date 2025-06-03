import { CloseIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons'
import { DrawerFooter, Flex, Grid, GridItem, IconButton, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react'
import Spinner from "components/spinner/Spinner"
import moment from 'moment'
import { useEffect, useState } from 'react'
import { BiLink } from 'react-icons/bi'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { HasAccess } from "../../../redux/accessUtils";
import { useDispatch, useSelector } from 'react-redux';
import { fetchSingleMeeting } from '../../../redux/slices/meetingSlice';

const MeetingView = (props) => {
    const { onClose, isOpen, info, fetchData, setAction, action, access } = props
    const dispatch = useDispatch();
    const { currentMeeting: data, isLoading } = useSelector((state) => state.meetingData);
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user"))
    const [edit, setEdit] = useState(false);
    const [deleteModel, setDelete] = useState(false);

    useEffect(() => {
        if (info) {
            const meetingId = info?.event ? info.event.id : info;
            dispatch(fetchSingleMeeting(meetingId));
        }
    }, [dispatch, info, action]);

    const [contactAccess, leadAccess] = HasAccess(['Contacts', 'Leads'])

    const renderAttendees = () => {
        if (!data?.related) return '-';

        const isContact = data.related.toLowerCase() === 'contact';
        const isLead = data.related.toLowerCase() === 'lead';

        if (isContact && data?.attendes?.length > 0) {
            return data.attendes.map((item) => (
                contactAccess?.view ? (
                    <Link key={item._id} to={`/contactView/${item._id}`}>
                        <Text color='brand.600' sx={{ '&:hover': { color: 'blue.500', textDecoration: 'underline' } }}>
                            {item.email || 'No Email'}
                        </Text>
                    </Link>
                ) : (
                    <Text key={item._id} color='blackAlpha.900'>
                        {item.email || 'No Email'}
                    </Text>
                )
            ));
        }

        if (isLead && data?.attendesLead?.length > 0) {
            return data.attendesLead.map((item) => (
                leadAccess?.view ? (
                    <Link key={item._id} to={`/leadView/${item._id}`}>
                        <Text color='brand.600' sx={{ '&:hover': { color: 'blue.500', textDecoration: 'underline' } }}>
                            {item.leadName || 'Unknown Lead'}
                        </Text>
                    </Link>
                ) : (
                    <Text key={item._id} color='blackAlpha.900'>
                        {item.leadName || 'Unknown Lead'}
                    </Text>
                )
            ));
        }

        return '-';
    };

    const handleViewOpen = () => {
        if (info?.event) {
            navigate(`/view/${info?.event?.id}`)
        }
        else {
            navigate(`/view/${info}`)
        }
    }

    return (
        <Modal isOpen={isOpen} size={'md'} isCentered>
            <ModalOverlay />
            <ModalContent height={"70%"}>
                <ModalHeader justifyContent='space-between' display='flex' >
                    Meeting
                    <IconButton onClick={() => onClose(false)} icon={<CloseIcon />} />
                </ModalHeader>
                {isLoading ?
                    <Flex justifyContent={'center'} alignItems={'center'} mb={30} width="100%" >
                        <Spinner />
                    </Flex> : <>
                        <ModalBody overflowY={"auto"}>
                            <Grid templateColumns="repeat(12, 1fr)" gap={3} >
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Agenda </Text>
                                    <Text>{data?.agenda || '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Date&Time  </Text>
                                    <Text>{data?.dateTime ? moment(data?.dateTime).format('lll ') : '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Created By </Text>
                                    <Text>{data?.createdByName || '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Related </Text>
                                    <Text>{data?.related || '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Location </Text>
                                    <Text>{data?.location || '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Notes </Text>
                                    <Text>{data?.notes || '-'}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }} >
                                    <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}> Attendees </Text>
                                    {renderAttendees()}
                                </GridItem>
                            </Grid>
                        </ModalBody>
                        <DrawerFooter>
                            {access?.view && <IconButton variant='outline' colorScheme={'green'} onClick={() => handleViewOpen()} borderRadius="10px" size="md" icon={<ViewIcon />} />}
                            {access?.update && <IconButton variant='outline' onClick={() => setEdit(true)} ml={3} borderRadius="10px" size="md" icon={<EditIcon />} />}
                            {access?.delete && <IconButton colorScheme='red' onClick={() => setDelete(true)} ml={3} borderRadius="10px" size="md" icon={<DeleteIcon />} />}
                        </DrawerFooter>
                    </>}
            </ModalContent>
        </Modal>
    )
}

export default MeetingView
