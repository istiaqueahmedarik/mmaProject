#include <Arduino.h>
#include "WebSocketServer.h"
#define ENA 13
#define ENB 15
#define IN1 12 /// L
#define IN2 14 /// L
#define IN3 27
#define IN4 26
#define HW_479_RED 34
#define HW_479_GREEN 32
#define HW_479_BLUE 34

void motorDirection_for_IN1_IN2(int direction)
{
    // 1 is forward, 2 is backward, 0 is stop
    if (direction == 1)
    {
        digitalWrite(IN1, HIGH);
        digitalWrite(IN2, LOW);
    }
    else if (direction == 2)
    {
        digitalWrite(IN1, LOW);
        digitalWrite(IN2, HIGH);
    }
    else
    {
        digitalWrite(IN1, LOW);
        digitalWrite(IN2, LOW);
    }
}

void motorDirection_for_IN3_IN4(int direction)
{
    if (direction == 1)
    {
        digitalWrite(IN3, HIGH);
        digitalWrite(IN4, LOW);
    }
    else if (direction == 2)
    {
        digitalWrite(IN3, LOW);
        digitalWrite(IN4, HIGH);
    }
    else
    {
        digitalWrite(IN3, LOW);
        digitalWrite(IN4, LOW);
    }
}

void motor_speed_set(int motorIdx, int speed)
{
    if (motorIdx == 1)
    {
        analogWrite(ENA, speed);
    }
    else if (motorIdx == 2)
    {
        analogWrite(ENB, speed);
    }
}

WebSocketServer wsServer(80, "/ws");

void handleMessage(const char *msg)
{
    // data type is 0, speedLeft, speedRight
    int left = 0;
    int right = 0;

    int firstComma = -1;
    for (int i = 0; i < strlen(msg); i++)
    {
        if (msg[i] == ',')
        {
            firstComma = i;
            break;
        }
    }
    if (firstComma == -1)
        return;
    for (int i = firstComma + 1; i < strlen(msg); i++)
    {
        if (msg[i] == ',')
        {
            left = atoi(msg + firstComma + 1);
            right = atoi(msg + i + 1);
            break;
        }
    }
    int directionLeft = 0;
    // 1000-1500 is forward and 1500-2000 is backward
    if (left > 1500)
    {
        directionLeft = 1;
        left = left - 1500;
    }
    else
    {
        directionLeft = 2;
        left = 1500 - left;
    }
    int directionRight = 0;
    if (right > 1500)
    {
        directionRight = 1;
        right = right - 1500;
    }
    else
    {
        directionRight = 2;
        right = 1500 - right;
    }
    motorDirection_for_IN1_IN2(directionLeft);
    motorDirection_for_IN3_IN4(directionRight);

    int leftSpeed = map(left, 0, 500, 0, 125);
    int rightSpeed = map(right, 0, 500, 0, 125);
    Serial.println(leftSpeed);
    Serial.println(directionLeft);
    Serial.println(rightSpeed);
    Serial.println(directionRight);
    motor_speed_set(1, leftSpeed);
    motor_speed_set(2, rightSpeed);
}

void setup()
{
    Serial.begin(115200);

    pinMode(ENA, OUTPUT);
    pinMode(ENB, OUTPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);
    pinMode(HW_479_RED, OUTPUT);
    pinMode(HW_479_GREEN, OUTPUT);
    pinMode(HW_479_BLUE, OUTPUT);

    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);

    digitalWrite(HW_479_RED, LOW);
    digitalWrite(HW_479_GREEN, LOW);
    digitalWrite(HW_479_BLUE, LOW);

    digitalWrite(HW_479_RED, HIGH);

    wsServer.begin("Victus_Ext", "1732020@4G");

    wsServer.onMessage(handleMessage);
}

void loop()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        WiFi.reconnect();
        digitalWrite(HW_479_RED, HIGH);
        digitalWrite(HW_479_GREEN, LOW);
        digitalWrite(HW_479_BLUE, LOW);
    }
    else
    {
        digitalWrite(HW_479_RED, LOW);
        digitalWrite(HW_479_GREEN, HIGH);
        digitalWrite(HW_479_BLUE, LOW);
    }
}