import User from "../models/users.js";
import Doctor from "../models/doctors.js";
import Appointment from "../models/appointments.js";
import UserAppointment from "../models/userAppointments.js";
import DoctorAppointment from "../models/doctorAppointments.js";
import mongoose from "mongoose";

export async function getUserprofile(req,res){
        /*
#swagger.tags = ['User']
*/
    try{
        let user= await User.findById(req.params.uid);
        if(!user){
            return res.status(400).json({
                status:'fail',
                message:'User not found'
            });
        }
        return res.status(200).json({
            status:'success',
            profile:{
                id: user.id,
                name:user.name,
                email:user.email,
                role:user.role,
                age:user.age,
                address:user.address,
                phone:user.phone,
                createdAt:user.createdAt,
                gender:user.gender,
                username:user.username,
            }
        });
    }catch(err){
        return res.status(500).json({
            status:'fail',
            message:err.message
        });
    }
}

export async function updateUserprofile(req,res){
            /*
#swagger.tags = ['User']
*/
    try{
        let user= await User.findById(req.user.id);
        if(!user){
            return res.status(400).json({
                status:'fail',
                message:'User not found'
            });
        }
        user.name=req.body.name;
        user.email=req.body.email;
        user.age=req.body.age;
        user.address=req.body.address;
        user.phone=req.body.phone;
        user.gender=req.body.gender;
        user.username=req.body.username;
        await user.save();
        return res.status(200).json({
            status:'success',
            profile:{
                id: user.id,
                name:user.name,
                email:user.email,
                role:user.role,
                age:user.age,
                address:user.address,
                phone:user.phone,
                createdAt:user.createdAt,
                gender:user.gender,
                username:user.username,
            }
        });
    }catch(err){
        return res.status(500).json({
            status:'fail',
            message:err.message
        });
    }
}

export async function bookAppointment(req,res){
            /*
#swagger.tags = ['User']
*/
let {doctorId,date,startTime,endTime}= req.body;
let doctor= await Doctor.findById(doctorId);
    if(!doctor){
        return res.status(400).json({
            status:'fail',
            message:'Doctor not found'
        });
    };
    const session= await mongoose.connection.startSession();
    try {
        await session.withTransaction(async () => { 
    
    let temp_day= new Date(date.split('-').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' });

    let isAvailable=false; 
    for (let day of doctor.availability) {
        if (day.day==temp_day) {
            for (let slot of day.slots) {
                if (slot.start==startTime && slot.end==endTime) {
                    if (slot.status=='available') {
                        isAvailable=true;
                    }
                }
            }
        }
    }
    if (!isAvailable) {
        throw new Error('Slot not available');
    }

    
    let dateStr = date;
    let parts = dateStr.split("-");
    let dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    let uid=req.user.id;
    let newAppointment={
        doctorId:doctorId,
        userId:uid,
        date:dateObj,
        startTime:startTime,
        endTime:endTime,
        status:'confirmed'
    };


    let app= await Appointment.create([newAppointment],{session});
    let app_id=app[0]._id;

    await UserAppointment.create([{
        userId:uid,
        appointmentId:app_id,
    }],{session});

   await DoctorAppointment.create([{
        doctorId:doctorId,
        appointmentId:app_id,
    }],{session});

    for (let day of doctor.availability) {
        if (day.day==temp_day) {
            for (let slot of day.slots) {
                if (slot.start==startTime && slot.end==endTime) {
                    slot.status='booked';
                }
            }
        }
    }
    await Doctor.updateOne(
        { _id: doctorId },
        { $set: { availability: doctor.availability } },
        { session }
    );

    
});
    session.endSession(); 
    return res.status(200).json({
        status:'success',
        message:'Appointment booked successfully',
    });
} catch (error) {
    return res.status(500).json({
        status:'fail',
        message:error.message
    });
}
}
    


export async function getUserAppointments(req,res){
            /*
#swagger.tags = ['User']
*/
let uid=req.user.id;
    try {
    
    // let userAppointments= await UserAppointment.find({userId:uid});
    // console.log(userAppointments);
    // if (!userAppointments) {
    //     return res.status(200).json({
    //         status:'success',
    //         appointments:[],
    //     });
    // };
    // let appointments=[];
    // for (let userApp of userAppointments) {
    //     console.log(userApp.appointmentId);

    //     let appointment= await Appointment.findById(userApp.appointmentId).populate('doctorId').populate('userId');
    //     console.log(appointment);
    //    appointments.push(appointment);
    // }
    let appointments= await Appointment.find({userId:uid}).populate('doctorId').populate('userId');

    console.log(appointments);
    return res.status(200).json({
        status:'success',
        appointments:appointments,
    });
        
    } catch (error) {
        return res.status(500).json({
            status:'fail',
            message:error.message
        });
    }
    
}

export async function getUserNamebyId(req,res) {
            /*
#swagger.tags = ['User']
*/
    try {
        let user= await User.findById(req.params.uid);
        if (!user) {
            return res.status(400).json({
                status:'fail',
                message:'User not found'
            });
        };
        return res.status(200).json({
            status:'success',
            name:user.name,
        });
    } catch (error) {
        
    }
};

export async function cancelAppointment(req,res) {
            /*
#swagger.tags = ['User']
*/
let uid=req.user.id;
let appointmentId=req.body.aid;
let doctorId=req.body.did;
let doctor= await Doctor.findById(doctorId);
let userAppointment= await UserAppointment.findById(uid);
let appointment= await Appointment.findById(appointmentId);
let temp_day= new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long' });
console.log(userAppointment);
// if (!userAppointment) {
//     return res.status(400).json({
//         status:'fail',
//         message:'Appointment not found'
//     });
// };
    const session= await mongoose.connection.startSession();
    try {
        await session.withTransaction(async () => {
        await UserAppointment.findOneAndDelete([{userId:uid,appointmentId:appointmentId}],{session});
        await DoctorAppointment.findOneAndDelete([{appointmentId:appointmentId}],{session});
        await Appointment.findByIdAndDelete(appointmentId,{session});
       
        for (let day of doctor.availability) {
            if (day.day==temp_day) {
                for (let slot of day.slots) {
                    if (slot.start==appointment.startTime && slot.end==appointment.endTime) {
                        slot.status='available';
                    }
                }
            }
        }
        await Doctor.updateOne(
            { _id: doctorId },
            { $set: { availability: doctor.availability } },
            { session }
        );
});
        session.endSession();
        return res.status(200).json({
            status:'success',
            message:'Appointment cancelled successfully'
        });
        
    } catch (error) {
        return res.status(500).json({
            status:'fail',
            message:error.message
        });
        
    } 
}

export async function getAllDoctors(req,res){
            /*  #swagger.tags = ['User']
                #swagger.description = 'Get all doctors'
            */
    try {
        let doctors= await Doctor.find();
        if (!doctors) {
            return res.status(400).json({
                status:'fail',
                message:'No doctors found'
            });
        }
        else{
            return res.status(200).json({
                status:'success',
                doctors:doctors,
            });
        }
    } catch (error) {
        return res.status(500).json({
            status:'fail',
            message:error.message
        });
    }
}

export async function autoBookAppointment(req, res) {
    let date = req.body.date;
    let doctorId= req.body.doctorId;
    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        return res.status(400).json({
            status: 'fail',
            message: 'Doctor not found'
        });
    };
    function check(currentHour,curr_slot){
        let slottobe=0;
        switch (curr_slot){
            case '7:00':slottobe=7;break;
            case '8:00':slottobe=8;break;
            case '9:00':slottobe=9;break;
            case '10:00':slottobe=10;break;
            case '11:00':slottobe=11;break;
            case '12:00':slottobe=12;break;
            case '13:00':slottobe=13;break;
            case '14:00':slottobe=14;break;
            case '15:00':slottobe=15;break;
            case '16:00':slottobe=16;break;
            case '17:00':slottobe=17;break;
            case '18:00':slottobe=18;break;
            case '19:00':slottobe=19;break;
            case '20:00':slottobe=20;break;
            default:0;
        }
        return currentHour<slottobe;
    }
    const session = await mongoose.connection.startSession();
    try {
        await session.withTransaction(async () => {
            let temp_day= new Date(date.split('-').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' });
            let currTime=new Date().toLocaleString("en-us",{ timeZone: 'Asia/Kolkata' ,hour12:false},);
            let currentHour=currTime.split(" ")[1].split(":")[0];
            console.log(currTime);
            console.log(currentHour);
            let isAvailable = false;
            let slotToBook;
            for (let day of doctor.availability) {
                for (let slot of day.slots) {
                    
                    if (slot.status == 'available' && day.day == temp_day && check(currentHour,slot.start)) {
                        isAvailable = true;
                        slotToBook = slot;
                        console.log(slotToBook);
                        break;
                    }
                }
                if (isAvailable) {
                    break;
                }
            }
            if (!isAvailable) {
                throw new Error('No slots available');
            }
            let dateStr = date;
            let parts = dateStr.split("-");
            let dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
            let uid = req.user.id;
            let newAppointment = {
                doctorId: doctorId,
                userId: uid,
                date: dateObj,
                startTime: slotToBook.start,
                endTime: slotToBook.end,
                status: 'confirmed'
            };
            let app = await Appointment.create([newAppointment], { session });
            let app_id = app[0]._id;
            await UserAppointment.create([{
                userId: uid,
                appointmentId: app_id,
            }], { session });
            await DoctorAppointment.create([{
                doctorId: doctorId,
                appointmentId: app_id,
            }], { session });
            slotToBook.status = 'booked';
            await Doctor.updateOne(
                { _id: doctorId },
                { $set: { availability: doctor.availability } },
                { session }
            );
        });
        session.endSession();
        return res.status(200).json({
            status: 'success',
            message: 'Appointment auto-booked successfully',
        });
    } catch (error) {
        session.endSession();
        return res.status(500).json({
            status: 'fail',
            message: error.message
        });
    }
}