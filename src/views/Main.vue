<template>
    <div class="main-view">
        <page-header></page-header>
        <sidebar></sidebar>
    </div>
</template>

<script>
    import PageHeader from '@/components/PageHeader'
    import Sidebar from '@/components/Sidebar'
    export default {
        name: 'Main-view',
        components: {PageHeader, Sidebar}
    }
</script>

<style scoped>

</style>
