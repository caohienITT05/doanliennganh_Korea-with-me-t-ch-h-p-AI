package com.koreanwithme.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // 1. Gửi Link xác nhận đăng ký
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        // Link này sẽ trỏ thẳng vào API xác thực của Backend
        String verifyLink = "http://localhost:8088/api/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Xác nhận tài khoản - Korean With Me");
        message.setText("Chào " + fullName + ",\n\n" +
                "Bạn vừa đăng ký tài khoản tại Korean With Me. Để hoàn tất đăng ký và bắt đầu học tập, vui lòng click vào đường link dưới đây để xác thực email của bạn:\n" +
                verifyLink + "\n\n" +
                "Trân trọng,\nĐội ngũ Korean With Me");
        mailSender.send(message);
    }
    // 2. Gửi mã OTP Quên mật khẩu
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã OTP khôi phục mật khẩu - Korean With Me");
        message.setText("Mã OTP để khôi phục mật khẩu của bạn là: " + otp + "\n\n" +
                "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n" +
                "Trân trọng,\nĐội ngũ Korean With Me");
        mailSender.send(message);
    }
}