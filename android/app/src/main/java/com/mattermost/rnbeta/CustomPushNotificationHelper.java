package com.mattermost.rnbeta;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.graphics.drawable.IconCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.wix.reactnativenotifications.core.NotificationIntentAdapter;
import com.wix.reactnativenotifications.core.notification.PushNotificationProps;

import java.io.IOException;
import java.util.Date;
import java.util.Objects;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class CustomPushNotificationHelper {
    public static final String CHANNEL_HIGH_IMPORTANCE_ID = "channel_01";
    public static final String CHANNEL_MIN_IMPORTANCE_ID = "channel_02";
    public static final String KEY_TEXT_REPLY = "CAN_REPLY";
    public static final int MESSAGE_NOTIFICATION_ID = 435345;
    public static final String NOTIFICATION_ID = "notificationId";

    private static NotificationChannel mHighImportanceChannel;
    private static NotificationChannel mMinImportanceChannel;

    private static void addMessagingStyleMessages(Context context, NotificationCompat.MessagingStyle messagingStyle, String conversationTitle, Bundle bundle) {
        String message = bundle.getString("message", bundle.getString("body"));
        String senderId = bundle.getString("sender_id");
        if (senderId == null) {
            senderId = "sender_id";
        }
        Bundle userInfoBundle = bundle.getBundle("userInfo");
        String senderName = getSenderName(bundle);
        if (userInfoBundle != null) {
            boolean localPushNotificationTest = userInfoBundle.getBoolean("test");
            if (localPushNotificationTest) {
                senderName = "Test";
            }
        }

        if (conversationTitle == null || !android.text.TextUtils.isEmpty(senderName.trim())) {
            message = removeSenderNameFromMessage(message, senderName);
        }

        long timestamp = new Date().getTime();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            messagingStyle.addMessage(message, timestamp, senderName);
        } else {
            Person.Builder sender = new Person.Builder()
                    .setKey(senderId)
                    .setName(senderName);

            try {
                sender.setIcon(IconCompat.createWithBitmap(Objects.requireNonNull(userAvatar(context, senderId))));
            } catch (IOException e) {
                e.printStackTrace();
            }

            messagingStyle.addMessage(message, timestamp, sender.build());
        }
    }

    private static void addNotificationExtras(NotificationCompat.Builder notification, Bundle bundle) {
        Bundle userInfoBundle = bundle.getBundle("userInfo");
        if (userInfoBundle == null) {
            userInfoBundle = new Bundle();
        }

        String channelId = bundle.getString("channel_id");
        if (channelId != null) {
            userInfoBundle.putString("channel_id", channelId);
        }

        notification.addExtras(userInfoBundle);
    }

    private static void addNotificationReplyAction(Context context, NotificationCompat.Builder notification, Bundle bundle, int notificationId) {
        String postId = bundle.getString("post_id");

        if (android.text.TextUtils.isEmpty(postId)) {
            return;
        }

        Intent replyIntent = new Intent(context, NotificationReplyBroadcastReceiver.class);
        replyIntent.setAction(KEY_TEXT_REPLY);
        replyIntent.putExtra(NOTIFICATION_ID, notificationId);
        replyIntent.putExtra("pushNotification", bundle);

        PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                replyIntent,
                PendingIntent.FLAG_UPDATE_CURRENT);

        RemoteInput remoteInput = new RemoteInput.Builder(KEY_TEXT_REPLY)
                .setLabel("Reply")
                .build();

        int icon = R.drawable.ic_notif_action_reply;
        CharSequence title = "Reply";
        NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(icon, title, replyPendingIntent)
                .addRemoteInput(remoteInput)
                .setAllowGeneratedReplies(true)
                .build();

        notification
                .setShowWhen(true)
                .addAction(replyAction);
    }

    public static NotificationCompat.Builder createNotificationBuilder(Context context, PendingIntent intent, Bundle bundle, boolean createSummary) {
        final NotificationCompat.Builder notification = new NotificationCompat.Builder(context, CHANNEL_HIGH_IMPORTANCE_ID);

        String channelId = bundle.getString("channel_id");
        String postId = bundle.getString("post_id");
        int notificationId = postId != null ? postId.hashCode() : MESSAGE_NOTIFICATION_ID;
        NotificationPreferences notificationPreferences = NotificationPreferences.getInstance(context);

        addNotificationExtras(notification, bundle);
        setNotificationIcons(context, notification, bundle);
        setNotificationMessagingStyle(context, notification, bundle);
        setNotificationGroup(notification, channelId, createSummary);
        setNotificationBadgeType(notification);
        setNotificationSound(notification, notificationPreferences);
        setNotificationVibrate(notification, notificationPreferences);
        setNotificationBlink(notification, notificationPreferences);

        setNotificationChannel(notification, bundle);
        setNotificationDeleteIntent(context, notification, bundle, notificationId);
        addNotificationReplyAction(context, notification, bundle, notificationId);

        notification
                .setContentIntent(intent)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setPriority(Notification.PRIORITY_HIGH)
                .setCategory(Notification.CATEGORY_MESSAGE)
                .setAutoCancel(true);

        return notification;
    }

    public static void createNotificationChannels(Context context) {
        // Notification channels are not supported in Android Nougat and below
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        final NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);

        if (mHighImportanceChannel == null) {
            mHighImportanceChannel = new NotificationChannel(CHANNEL_HIGH_IMPORTANCE_ID, "High Importance", NotificationManager.IMPORTANCE_HIGH);
            mHighImportanceChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(mHighImportanceChannel);
        }

        if (mMinImportanceChannel == null) {
            mMinImportanceChannel = new NotificationChannel(CHANNEL_MIN_IMPORTANCE_ID, "Min Importance", NotificationManager.IMPORTANCE_MIN);
            mMinImportanceChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(mMinImportanceChannel);
        }
    }

    private static Bitmap getCircleBitmap(Bitmap bitmap) {
        final Bitmap output = Bitmap.createBitmap(bitmap.getWidth(),
                bitmap.getHeight(), Bitmap.Config.ARGB_8888);
        final Canvas canvas = new Canvas(output);

        final int color = Color.RED;
        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        canvas.drawOval(rectF, paint);

        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);

        bitmap.recycle();

        return output;
    }

    private static String getConversationTitle(Bundle bundle) {
        String title = bundle.getString("channel_name");

        if (android.text.TextUtils.isEmpty(title)) {
            title = bundle.getString("sender_name");
        }

        return title;
    }

    private static int getIconResourceId(Context context, String iconName) {
        final Resources res = context.getResources();
        String packageName = context.getPackageName();
        String defType = "mipmap";

        return res.getIdentifier(iconName, defType, packageName);
    }

    private static NotificationCompat.MessagingStyle getMessagingStyle(Context context, Bundle bundle) {
        NotificationCompat.MessagingStyle messagingStyle;
        String senderId = "me";

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            messagingStyle = new NotificationCompat.MessagingStyle("Me");
        } else {
            Person.Builder sender = new Person.Builder()
                    .setKey(senderId)
                    .setName("Me");

            try {
                sender.setIcon(IconCompat.createWithBitmap(Objects.requireNonNull(userAvatar(context, "me"))));
            } catch (IOException e) {
                e.printStackTrace();
            }

            messagingStyle = new NotificationCompat.MessagingStyle(sender.build());
        }

        String conversationTitle = getConversationTitle(bundle);
        setMessagingStyleConversationTitle(messagingStyle, conversationTitle, bundle);
        addMessagingStyleMessages(context, messagingStyle, conversationTitle, bundle);

        return messagingStyle;
    }

    private static String getSenderName(Bundle bundle) {
        String senderName = bundle.getString("sender_name");
        if (senderName != null) {
            return senderName;
        }

        String channelName = bundle.getString("channel_name");
        if (channelName != null && channelName.startsWith("@")) {
            return channelName;
        }

        String message = bundle.getString("message");
        if (message != null) {
            String name = message.split(":")[0];
            if (!name.equals(message)) {
                return name;
            }
        }

        return getConversationTitle(bundle);
    }

    public static int getSmallIconResourceId(Context context, String iconName) {
        if (iconName == null) {
            iconName = "ic_notification";
        }

        int resourceId = getIconResourceId(context, iconName);

        if (resourceId == 0) {
            iconName = "ic_launcher";
            resourceId = getIconResourceId(context, iconName);

            if (resourceId == 0) {
                resourceId = android.R.drawable.ic_dialog_info;
            }
        }

        return resourceId;
    }

    private static String removeSenderNameFromMessage(String message, String senderName) {
        int index = message.indexOf(senderName);
        if (index == 0) {
            message = message.substring(senderName.length());
        }

        return message.replaceFirst(": ", "").trim();
    }

    private static void setMessagingStyleConversationTitle(NotificationCompat.MessagingStyle messagingStyle, String conversationTitle, Bundle bundle) {
        String channelName = getConversationTitle(bundle);
        String senderName = bundle.getString("sender_name");
        if (TextUtils.isEmpty(senderName)) {
            senderName = getSenderName(bundle);
        }

        if (conversationTitle != null && !channelName.equals(senderName)) {
            messagingStyle.setConversationTitle(conversationTitle);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                messagingStyle.setGroupConversation(true);
            }
        }
    }

    private static void setNotificationBadgeType(NotificationCompat.Builder notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification.setBadgeIconType(NotificationCompat.BADGE_ICON_LARGE);
        }
    }

    private static void setNotificationBlink(NotificationCompat.Builder notification, NotificationPreferences notificationPreferences) {
        boolean blink = notificationPreferences.getShouldBlink();
        if (blink) {
            notification.setLights(Color.CYAN, 500, 500);
        }
    }

    private static void setNotificationChannel(NotificationCompat.Builder notification, Bundle bundle) {
        // If Android Oreo or above we need to register a channel
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel notificationChannel = mHighImportanceChannel;

        boolean testNotification = false;
        boolean localNotification = false;
        Bundle userInfoBundle = bundle.getBundle("userInfo");
        if (userInfoBundle != null) {
            testNotification = userInfoBundle.getBoolean("test");
            localNotification = userInfoBundle.getBoolean("local");
        }

        if (testNotification || localNotification) {
            notificationChannel = mMinImportanceChannel;
        }

        notification.setChannelId(notificationChannel.getId());
    }

    private static void setNotificationDeleteIntent(Context context, NotificationCompat.Builder notification, Bundle bundle, int notificationId) {
        // Let's add a delete intent when the notification is dismissed
        Intent delIntent = new Intent(context, NotificationDismissService.class);
        PushNotificationProps notificationProps = new PushNotificationProps(bundle);
        delIntent.putExtra(NOTIFICATION_ID, notificationId);
        PendingIntent deleteIntent = NotificationIntentAdapter.createPendingNotificationIntent(context, delIntent, notificationProps);
        notification.setDeleteIntent(deleteIntent);
    }

    private static void setNotificationMessagingStyle(Context context, NotificationCompat.Builder notification, Bundle bundle) {
        NotificationCompat.MessagingStyle messagingStyle = getMessagingStyle(context, bundle);
        notification.setStyle(messagingStyle);
    }

    private static void setNotificationGroup(NotificationCompat.Builder notification, String channelId, boolean setAsSummary) {
        notification.setGroup(channelId);

        if (setAsSummary) {
            // if this is the first notification for the channel then set as summary, otherwise skip
            notification.setGroupSummary(true);
        }
    }

    private static void setNotificationIcons(Context context, NotificationCompat.Builder notification, Bundle bundle) {
        String smallIcon = bundle.getString("smallIcon");
        String channelName = getConversationTitle(bundle);
        String senderName = bundle.getString("sender_name");

        int smallIconResId = getSmallIconResourceId(context, smallIcon);
        notification.setSmallIcon(smallIconResId);

        if (channelName.equals(senderName)) {
            try {
                String senderId = bundle.getString("sender_id");
                notification.setLargeIcon(userAvatar(context, senderId));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private static void setNotificationSound(NotificationCompat.Builder notification, NotificationPreferences notificationPreferences) {
        String soundUri = notificationPreferences.getNotificationSound();
        if (soundUri != null) {
            if (!soundUri.equals("none")) {
                notification.setSound(Uri.parse(soundUri));
            }
        } else {
            Uri defaultUri = Settings.System.DEFAULT_NOTIFICATION_URI;
            notification.setSound(defaultUri);
        }
    }

    private static void setNotificationVibrate(NotificationCompat.Builder notification, NotificationPreferences notificationPreferences) {
        boolean vibrate = notificationPreferences.getShouldVibrate();
        if (vibrate) {
            // Use the system default for vibration
            notification.setDefaults(Notification.DEFAULT_VIBRATE);
        }
    }

    private static Bitmap userAvatar(Context context, final String userId) throws IOException {
        final ReactApplicationContext reactApplicationContext = new ReactApplicationContext(context);
        final ReadableMap credentials = MattermostCredentialsHelper.getCredentialsSync(reactApplicationContext);
        final String serverUrl = credentials.getString("serverUrl");
        final String token = credentials.getString("token");


        final OkHttpClient client = new OkHttpClient();
        final String url = String.format("%s/api/v4/users/%s/image", serverUrl, userId);
        Request request = new Request.Builder()
                .header("Authorization", String.format("Bearer %s", token))
                .url(url)
                .build();
        Response response = client.newCall(request).execute();
        if (response.code() == 200) {
            assert response.body() != null;
            byte[] bytes = response.body().bytes();
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);

            Log.i("ReactNative", String.format("Fetch profile %s", url));
            return getCircleBitmap(bitmap);
        }

        return null;
    }
}
