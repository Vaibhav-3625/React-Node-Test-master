import { Button, Flex, FormLabel, Grid, GridItem, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Stack, Text, Textarea } from '@chakra-ui/react';
import { CUIAutoComplete } from 'chakra-ui-autocomplete';
import MultiContactModel from 'components/commonTableModel/MultiContactModel';
import MultiLeadModel from 'components/commonTableModel/MultiLeadModel';
import Spinner from 'components/spinner/Spinner';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { LiaMousePointerSolid } from 'react-icons/lia';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { MeetingSchema } from 'schema';
import { getApi, postApi } from 'services/api';
import { fetchContactData } from '../../../../redux/slices/contactSlice';
import { fetchLeadData } from '../../../../redux/slices/leadSlice';

const AddMeeting = (props) => {
    const { onClose, isOpen, setAction } = props;
    const dispatch = useDispatch();
    const [isLoding, setIsLoding] = useState(false);
    const [contactModelOpen, setContactModel] = useState(false);
    const [leadModelOpen, setLeadModel] = useState(false);
    const todayTime = new Date().toISOString().split('.')[0];
    
    // Use Redux store data
    const contactList = useSelector((state) => state?.contactData?.data);
    const leadState = useSelector((state) => state?.leadData);
    const leadList = Array.isArray(leadState?.data) ? leadState.data : [];
    const user = JSON.parse(localStorage.getItem('user'));

    const initialValues = {
        agenda: '',
        attendes: props.leadContect === 'contactView' && props.id ? [props.id] : [],
        attendesLead: props.leadContect === 'leadView' && props.id ? [props.id] : [],
        location: '',
        related: props.leadContect === 'contactView' ? 'Contact' : props.leadContect === 'leadView' ? 'Lead' : 'Contact',
        dateTime: '',
        notes: '',
        createBy: user?._id,
    };

    const formik = useFormik({
        initialValues: initialValues,
        validationSchema: MeetingSchema,
        onSubmit: (values, { resetForm }) => {
            AddData(values, resetForm);
        },
    });

    const { errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue } = formik;

    const AddData = async (values, resetForm) => {
        try {
            if (!values.agenda) {
                toast.error("Agenda is required");
                return;
            }
            if (!values.dateTime) {
                toast.error("Date Time is required");
                return;
            }
            if (!values.related) {
                toast.error("Related To is required");
                return;
            }

            setIsLoding(true);
            const response = await postApi('api/meeting/add', {
                ...values,
                createBy: user?._id
            });
            
            if (response.status === 201) {
                toast.success("Meeting created successfully");
                resetForm();
                onClose();
                setAction((prev) => !prev);
            } else {
                toast.error(response.data?.message || "Failed to create meeting");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoding(false);
        }
    };

    useEffect(() => {
        dispatch(fetchContactData());
        dispatch(fetchLeadData());
    }, [dispatch]);

    const extractLabels = (selectedItems) => {
        return selectedItems.map((item) => item._id);
    };

    const getFormattedItems = () => {
        if (values.related === "Contact") {
            return (contactList || []).map((item) => ({
                ...item,
                value: item._id,
                label: item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.email || item.phoneNumber || 'Unnamed Contact'
            }));
        }
        return (leadList || []).map((item) => ({
            ...item,
            value: item._id,
            label: item.leadName || item.email || 'Unnamed Lead'
        }));
    };

    const formattedItems = getFormattedItems();

    return (
        <Modal onClose={onClose} isOpen={isOpen} isCentered>
            <ModalOverlay />
            <ModalContent height={"580px"}>
                <ModalHeader>Add Meeting</ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY={"auto"} height={"400px"}>
                    <MultiContactModel 
                        data={contactList} 
                        isOpen={contactModelOpen} 
                        onClose={setContactModel} 
                        fieldName='attendes' 
                        setFieldValue={setFieldValue} 
                    />
                    <MultiLeadModel 
                        data={leadList} 
                        isOpen={leadModelOpen} 
                        onClose={setLeadModel} 
                        fieldName='attendesLead' 
                        setFieldValue={setFieldValue} 
                    />

                    <Grid templateColumns="repeat(12, 1fr)" gap={3}>
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Agenda<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.agenda}
                                name="agenda"
                                placeholder='Agenda'
                                fontWeight='500'
                                borderColor={errors.agenda && touched.agenda ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px' color={'red'}>{errors.agenda && touched.agenda && errors.agenda}</Text>
                        </GridItem>
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Related To<Text color={"red"}>*</Text>
                            </FormLabel>
                            <RadioGroup onChange={(e) => setFieldValue('related', e)} value={values.related}>
                                <Stack direction='row'>
                                    {props.leadContect === 'contactView' && <Radio value='Contact'>Contact</Radio>}
                                    {props.leadContect === 'leadView' && <Radio value='Lead'>Lead</Radio>}
                                    {!props.leadContect && (
                                        <>
                                            <Radio value='Contact'>Contact</Radio>
                                            <Radio value='Lead'>Lead</Radio>
                                        </>
                                    )}
                                </Stack>
                            </RadioGroup>
                            <Text mb='10px' color={'red'} fontSize='sm'>{errors.related && touched.related && errors.related}</Text>
                        </GridItem>
                        {values.related && formattedItems.length > 0 && (
                            <GridItem colSpan={{ base: 12 }}>
                                <Flex alignItems={'end'} justifyContent={'space-between'}>
                                    <Text w={'100%'}>
                                        <CUIAutoComplete
                                            label={`Choose Preferred Attendes ${values.related}`}
                                            placeholder="Type a Name"
                                            name="attendes"
                                            items={formattedItems}
                                            className='custom-autoComplete'
                                            selectedItems={formattedItems.filter((item) => 
                                                values.related === "Contact"
                                                    ? values.attendes.includes(item._id)
                                                    : values.attendesLead.includes(item._id)
                                            )}
                                            onSelectedItemsChange={(changes) => {
                                                const selectedLabels = extractLabels(changes.selectedItems);
                                                if (values.related === "Contact") {
                                                    setFieldValue('attendes', selectedLabels);
                                                } else {
                                                    setFieldValue('attendesLead', selectedLabels);
                                                }
                                            }}
                                        />
                                    </Text>
                                    <IconButton 
                                        mb={6} 
                                        onClick={() => values.related === "Contact" ? setContactModel(true) : setLeadModel(true)} 
                                        fontSize='25px' 
                                        icon={<LiaMousePointerSolid />} 
                                    />
                                </Flex>
                                <Text color={'red'}>{errors.attendes && touched.attendes && errors.attendes}</Text>
                            </GridItem>
                        )}
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Location
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.location}
                                name="location"
                                placeholder='Location'
                                fontWeight='500'
                                borderColor={errors.location && touched.location ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'} fontSize='sm'>{errors.location && touched.location && errors.location}</Text>
                        </GridItem>
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Date Time<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                type='datetime-local'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                min={dayjs(todayTime).format('YYYY-MM-DD HH:mm')}
                                value={values.dateTime}
                                name="dateTime"
                                placeholder='Date Time'
                                fontWeight='500'
                                borderColor={errors.dateTime && touched.dateTime ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px' color={'red'}>{errors.dateTime && touched.dateTime && errors.dateTime}</Text>
                        </GridItem>
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Notes
                            </FormLabel>
                            <Textarea
                                resize={'none'}
                                fontSize='sm'
                                placeholder='Notes'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.notes}
                                name="notes"
                                fontWeight='500'
                                borderColor={errors.notes && touched.notes ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'}>{errors.notes && touched.notes && errors.notes}</Text>
                        </GridItem>
                    </Grid>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant='brand' me={2} disabled={isLoding} onClick={handleSubmit}>
                        {isLoding ? <Spinner /> : 'Save'}
                    </Button>
                    <Button
                        sx={{
                            textTransform: "capitalize",
                        }}
                        variant="outline"
                        colorScheme="red"
                        size="sm"
                        onClick={() => {
                            formik.resetForm();
                            onClose();
                        }}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddMeeting;