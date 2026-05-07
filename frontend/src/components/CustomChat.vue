<template>
    <div class="robot-chat">
        <div class="chat-text">
            <p>
                Sample customer message for layout preview.
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: "RobotChat",
    props: {
        title: {
            type: String,
            default: "AI Assistant",
        },
    },
    data() {
        return {
            title: this.title,
        }
    },
}
</script>

<style scoped>
.robot-chat {
  border-radius: 20px;
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
  /* padding: 20px; */
}
p {
  max-width: 280px;
  font-size: 14px;
  padding: 10px;
 border-radius:  20px 2px 20px 20px;
color: #FFFFFF;
line-height: 20px;
background: #6557E9;
box-shadow: 0px 5px 8px 0px rgba(177,185,235,0.2);
}
</style>
