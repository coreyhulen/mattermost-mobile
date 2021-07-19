package com.mattermost.rnbeta;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.RemoteInput;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;

import java.io.IOException;
import java.util.Objects;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import org.json.JSONObject;
import org.json.JSONException;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactApplicationContext;

import com.wix.reactnativenotifications.core.NotificationIntentAdapter;
import com.wix.reactnativenotifications.core.ProxyService;
import com.wix.reactnativenotifications.core.notification.PushNotificationProps;

public class NotificationReplyBroadcastReceiver extends BroadcastReceiver {
    private Context mContext;
    private Bundle bundle;
    private NotificationManagerCompat notificationManager;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            final CharSequence message = getReplyMessage(intent);
            if (message == null) {
                return;
            }

            mContext = context;
            bundle = NotificationIntentAdapter.extractPendingNotificationDataFromIntent(intent);
            notificationManager = NotificationManagerCompat.from(context);

            final ReactApplicationContext reactApplicationContext = new ReactApplicationContext(context);
            final int notificationId = intent.getIntExtra(CustomPushNotificationHelper.NOTIFICATION_ID, -1);

            ReadableMap results = MattermostCredentialsHelper.getCredentialsSync(reactApplicationContext);
            replyToMessage(results.getString("serverUrl"), results.getString("token"), notificationId, message);
        }
    }

    protected void replyToMessage(final String serverUrl, final String token, final int notificationId, final CharSequence message) {
        final String channelId = bundle.getString("channel_id");
        final String postId = bundle.getString("post_id");
        String rootId = bundle.getString("root_id");
        if (android.text.TextUtils.isEmpty(rootId)) {
            rootId = postId;
        }

        if (token == null || serverUrl == null) {
            onReplyFailed(notificationId);
            return;
        }

        final OkHttpClient client = new OkHttpClient();
        final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        String json = buildReplyPost(channelId, rootId, message.toString());
        RequestBody body = RequestBody.create(JSON, json);

        String postsEndpoint = "/api/v4/posts?set_online=false";
        String url = String.format("%s%s", serverUrl.replaceAll("/$", ""), postsEndpoint);
        Log.i("ReactNative", String.format("Reply URL=%s", url));
        Request request = new Request.Builder()
            .header("Authorization", String.format("Bearer %s", token))
            .header("Content-Type", "application/json")
            .url(url)
            .post(body)
            .build();

        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.i("ReactNative", String.format("Reply FAILED exception %s", e.getMessage()));
                onReplyFailed(notificationId);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull final Response response) throws IOException {
                if (response.isSuccessful()) {
                    onReplySuccess(notificationId, message);
                    Log.i("ReactNative", "Reply SUCCESS");
                } else {
                    assert response.body() != null;
                    Log.i("ReactNative", String.format("Reply FAILED status %s BODY %s", response.code(), Objects.requireNonNull(response.body()).string()));
                    onReplyFailed(notificationId);
                }
            }
        });
    }

    protected String buildReplyPost(String channelId, String rootId, String message) {
        try {
            JSONObject json = new JSONObject();
            json.put("channel_id", channelId);
            json.put("message", message);
            json.put("root_id", rootId);
            return json.toString();
        } catch(JSONException e) {
            return "{}";
        }
    }

    protected void onReplyFailed(int notificationId) {
        recreateNotification(notificationId, "Message failed to send.");
    }

    protected void onReplySuccess(int notificationId, final CharSequence message) {
        recreateNotification(notificationId, message);
    }

    private void recreateNotification(int notificationId, final CharSequence message) {
        final Intent cta = new Intent(mContext, ProxyService.class);
        final PushNotificationProps notificationProps = new PushNotificationProps(bundle);
        final PendingIntent pendingIntent = NotificationIntentAdapter.createPendingNotificationIntent(mContext, cta, notificationProps);
        NotificationCompat.Builder builder = CustomPushNotificationHelper.createNotificationBuilder(mContext, pendingIntent, bundle, false);
        Notification notification =  builder.build();
        NotificationCompat.MessagingStyle messagingStyle = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification);
        assert messagingStyle != null;
        messagingStyle.addMessage(message, System.currentTimeMillis(), (Person)null);
        notification = builder.setStyle(messagingStyle).build();
        notificationManager.notify(notificationId, notification);
    }

    private CharSequence getReplyMessage(Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput != null) {
            return remoteInput.getCharSequence(CustomPushNotificationHelper.KEY_TEXT_REPLY);
        }
        return null;
    }
}
